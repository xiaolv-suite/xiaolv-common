/* lv-kit-compass v200 */
var __LV_KIT_CHUNK_EXPORT__=(()=>{var jn=Object.defineProperty;var Ba=Object.getOwnPropertyDescriptor;var Pa=Object.getOwnPropertyNames;var Ra=Object.prototype.hasOwnProperty;var _a=(H,q)=>{for(var C in q)jn(H,C,{get:q[C],enumerable:!0})},Oa=(H,q,C,We)=>{if(q&&typeof q=="object"||typeof q=="function")for(let ae of Pa(q))!Ra.call(H,ae)&&ae!==C&&jn(H,ae,{get:()=>q[ae],enumerable:!(We=Ba(q,ae))||We.enumerable});return H};var ja=H=>Oa(jn({},"__esModule",{value:!0}),H);var Wa={};_a(Wa,{createCompassChunk:()=>Ro,default:()=>Ka});var Fa=`/* ===== 移动端统一弹射坞（Bottom Sheet · Modern Tactile Glass 2.0）===== */
#lv-launchpad-sheet-mask {
    --lv-lp-bg: linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
    --lv-lp-panel-bg: #f8fafc;
    --lv-lp-card-bg: #ffffff;
    --lv-lp-border: rgba(15, 23, 42, 0.075);
    --lv-lp-border-strong: rgba(15, 23, 42, 0.12);
    --lv-lp-text: #0f172a;
    --lv-lp-text-sub: #64748b;
    --lv-lp-accent: #2563eb;
    --lv-lp-accent-soft: rgba(37, 99, 235, 0.09);
    --lv-lp-card-shadow: 0 2px 8px -2px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9);
    --lv-lp-icon-inset: inset 0 1px 0 rgba(255, 255, 255, 0.65);
    position: fixed;
    inset: 0;
    z-index: 1080;
    background: rgba(15, 23, 42, 0.42);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    overscroll-behavior: contain;
    touch-action: none;
    animation: lvSheetMaskIn 160ms ease-out both;
}
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark) #lv-launchpad-sheet-mask {
    --lv-lp-bg: linear-gradient(165deg, rgba(24, 28, 38, 0.98) 0%, rgba(15, 18, 26, 0.99) 100%);
    --lv-lp-panel-bg: rgba(30, 36, 49, 0.78);
    --lv-lp-card-bg: rgba(33, 39, 53, 0.92);
    --lv-lp-border: rgba(255, 255, 255, 0.085);
    --lv-lp-border-strong: rgba(255, 255, 255, 0.14);
    --lv-lp-text: #f8fafc;
    --lv-lp-text-sub: #94a3b8;
    --lv-lp-accent: #60a5fa;
    --lv-lp-accent-soft: rgba(59, 130, 246, 0.18);
    --lv-lp-card-shadow: 0 4px 14px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.06);
    --lv-lp-icon-inset: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}
#lv-launchpad-sheet-mask .lv-sheet {
    width: 100%;
    max-height: min(92dvh, 780px);
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    background: var(--lv-lp-bg);
    color: var(--lv-lp-text);
    border-radius: 22px 22px 0 0;
    border-top: 1px solid var(--lv-lp-border-strong);
    box-shadow: 0 -16px 48px rgba(15, 23, 42, 0.24);
    padding: 6px max(12px, env(safe-area-inset-right, 0px)) calc(10px + env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-left, 0px));
    box-sizing: border-box;
    animation: lvSheetUp 240ms cubic-bezier(0.22, 1, 0.36, 1) both;
    will-change: transform;
}
/* 磁贴徽记胶囊：高对比度清透微胶囊 */
.lv-sheet-tile-badge {
    font-size: 10px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--lv-lp-accent-soft);
    color: var(--lv-lp-accent);
    border: 1px solid color-mix(in srgb, var(--lv-lp-accent) 18%, transparent);
    line-height: 1.35;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.lv-sheet-tile-badge--success { background: rgba(16, 185, 129, 0.12); color: #059669; border-color: rgba(16, 185, 129, 0.22); }
.lv-sheet-tile-badge--warn { background: rgba(245, 158, 11, 0.14); color: #d97706; border-color: rgba(245, 158, 11, 0.24); }
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark) .lv-sheet-tile-badge--success { background: rgba(16, 185, 129, 0.18); color: #34d399; border-color: rgba(52, 211, 153, 0.28); }
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark) .lv-sheet-tile-badge--warn { background: rgba(245, 158, 11, 0.18); color: #fbbf24; border-color: rgba(251, 191, 36, 0.28); }
.lv-sheet-result-count { font-size: 11px; color: var(--lv-lp-text-sub); padding: 0 2px 2px; }
/* 穿透结果分组头（按来源） */
.lv-sheet-result-group { font-size: 11px; font-weight: 700; color: var(--lv-lp-accent); padding: 6px 2px 2px; }
/* 搜索历史 chips */
.lv-sheet-histrow { display: flex; align-items: center; gap: 6px; overflow-x: auto; margin: 0 0 5px; overscroll-behavior-x: contain; scrollbar-width: none; }
.lv-sheet-histrow::-webkit-scrollbar { display: none; }
.lv-sheet-histrow-label { flex-shrink: 0; font-size: 11px; color: var(--lv-lp-text-sub); }
.lv-sheet-histrow-chip {
    flex-shrink: 0;
    border: 1px dashed var(--lv-lp-border-strong);
    background: var(--lv-lp-card-bg);
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 11.5px;
    color: var(--lv-lp-text);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
.lv-sheet-histrow-chip:active { background: var(--lv-lp-accent-soft); color: var(--lv-lp-accent); }
/* 生态直达行（收敛为底部轻量辅助操作，2×2 等宽网格杜绝 390px 挤压截断） */
.lv-sheet-eco-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin: 4px 0 6px; }
.lv-sheet-eco-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    border: 1px dashed var(--lv-lp-border);
    background: transparent;
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 11.5px;
    font-weight: 500;
    color: var(--lv-lp-text-sub);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.14s ease, border-color 0.14s ease, color 0.14s ease;
}
.lv-sheet-eco-chip:active { transform: scale(0.97); background: var(--lv-lp-accent-soft); border-color: var(--lv-lp-accent); color: var(--lv-lp-accent); }
/* 最近直达行：上次使用的插件一键再达 */
.lv-sheet-recent { display: flex; align-items: center; gap: 6px; overflow-x: auto; margin: 0 0 6px; padding-bottom: 1px; overscroll-behavior-x: contain; scrollbar-width: none; }
.lv-sheet-recent::-webkit-scrollbar { display: none; }
.lv-sheet-recent-label { flex-shrink: 0; font-size: 11px; font-weight: 600; color: var(--lv-lp-text-sub); }
.lv-sheet-recent-chip {
    flex-shrink: 0;
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-card-bg);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 11.5px;
    font-weight: 500;
    color: var(--lv-lp-text);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
.lv-sheet-recent-chip:active { background: var(--lv-lp-accent-soft); color: var(--lv-lp-accent); }
.lv-sheet-handle {
    width: 36px;
    height: 4px;
    margin: 0 auto 6px;
    border-radius: 999px;
    background: var(--lv-lp-border-strong);
}
.lv-sheet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    margin-bottom: 6px;
}
.lv-sheet-title { font-size: 14.5px; font-weight: 700; color: var(--lv-lp-text); letter-spacing: -0.01em; white-space: nowrap; flex-shrink: 0; }
.lv-sheet-head-actions { display: flex; align-items: center; gap: 4px; margin-left: auto; min-width: 0; flex-shrink: 1; }
.lv-sheet-close {
    position: relative;
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-card-bg);
    width: 30px;
    height: 30px;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    font-size: 13px;
    line-height: 1;
    padding: 0;
    color: var(--lv-lp-text-sub);
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.12s ease, background-color 0.14s ease, color 0.14s ease;
}
.lv-sheet-close::before {
    content: "";
    position: absolute;
    inset: -7px;
}
.lv-sheet-close:active { transform: scale(0.92); background: var(--lv-lp-accent-soft); color: var(--lv-lp-accent); }
.lv-sheet-search-wrap { position: relative; display: flex; align-items: center; margin-bottom: 5px; }
.lv-sheet-search-wrap .lv-sheet-search { margin-bottom: 0; padding-right: 32px; }
.lv-sheet-search-clear {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    width: 22px;
    height: 22px;
    min-height: 22px !important;
    border-radius: 999px;
    border: none;
    background: var(--lv-lp-border);
    color: var(--lv-lp-text-sub);
    font-size: 11px;
    display: none;
    place-items: center;
    cursor: pointer;
    padding: 0;
}
.lv-sheet-search-clear.visible { display: grid; }
.lv-sheet-search.b3-text-field,
.lv-sheet-search {
    width: 100%;
    height: 36px;
    box-sizing: border-box;
    margin-bottom: 5px;
    padding: 4px 11px;
    border-radius: 10px;
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-panel-bg);
    color: var(--lv-lp-text);
    font-size: 13px;
    box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.02);
}
.lv-sheet-search:focus {
    background: var(--lv-lp-card-bg);
    border-color: var(--lv-lp-accent);
    box-shadow: 0 0 0 3px var(--lv-lp-accent-soft);
    outline: none;
}
.lv-sheet-results { display: flex; flex-direction: column; gap: 5px; margin-bottom: 6px; }
.lv-sheet-result {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-card-bg);
    box-shadow: var(--lv-lp-card-shadow);
    border-radius: 10px;
    padding: 7px 10px;
    text-align: left;
    cursor: pointer;
}
.lv-sheet-result-badge {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--lv-lp-accent-soft);
    color: var(--lv-lp-accent);
}
.lv-sheet-result-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.lv-sheet-result-title { font-size: 13px; font-weight: 600; color: var(--lv-lp-text); }
.lv-sheet-result-snippet {
    font-size: 11.5px;
    color: var(--lv-lp-text-sub);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
/* 磁贴网格自适应列数：1~2 个插件时自动放宽为居中大卡，3+ 恢复三列，杜绝孤卡稀疏 */
.lv-sheet-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; margin-bottom: 6px; }
.lv-sheet-grid--sparse { grid-template-columns: repeat(auto-fit, minmax(150px, 190px)); justify-content: center; }
.lv-sheet-subtitle { font-size: 11px; color: var(--lv-lp-text-sub); margin: 0 0 4px; font-weight: 500; }
.lv-sheet-tile {
    --tile-brand: #3b82f6;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5px;
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-card-bg);
    background-image: radial-gradient(80px circle at 85% 15%, color-mix(in srgb, var(--tile-brand) 9%, transparent), transparent 70%);
    box-shadow: var(--lv-lp-card-shadow);
    border-radius: 12px;
    padding: 8px 5px 7px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    min-width: 0;
    transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.16s ease, box-shadow 0.16s ease;
}
.lv-sheet-tile:focus-visible {
    outline: 2px solid var(--lv-lp-accent, #2563eb);
    outline-offset: 2px;
}
.lv-sheet-tile:active {
    transform: scale(0.96);
    border-color: color-mix(in srgb, var(--tile-brand) 55%, transparent);
}
.lv-sheet-tile-dot { width: 10px; height: 10px; border-radius: 999px; background: var(--lv-lp-accent); }
.lv-sheet-tile-name { font-size: 13px; font-weight: 650; color: var(--lv-lp-text); text-align: center; line-height: 1.2; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lv-sheet-tile-desc {
    font-size: 10.5px;
    color: var(--lv-lp-text-sub);
    text-align: center;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.lv-sheet-tile--expanded { grid-column: 1 / -1; flex-direction: row; flex-wrap: wrap; justify-content: flex-start; padding: 10px; }
.lv-sheet-tile-icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: linear-gradient(135deg, color-mix(in srgb, currentColor 16%, var(--lv-lp-card-bg)) 0%, color-mix(in srgb, currentColor 7%, var(--lv-lp-card-bg)) 100%);
    border: 1px solid color-mix(in srgb, currentColor 24%, transparent);
    box-shadow: 0 4px 10px -2px color-mix(in srgb, currentColor 20%, transparent), var(--lv-lp-icon-inset);
    color: var(--lv-lp-accent);
    margin-bottom: 1px;
}
.lv-sheet-tile-icon svg { width: 17px; height: 17px; }
.lv-sheet-tile-actions { display: flex; flex-wrap: wrap; gap: 6px; width: 100%; margin-top: 6px; }
.lv-sheet-action-chip {
    border: 1px solid var(--lv-lp-border-strong);
    background: var(--lv-lp-card-bg);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
    border-radius: 999px;
    padding: 5px 11px;
    font-size: 12px;
    font-weight: 500;
    color: var(--lv-lp-text);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
}
.lv-sheet-action-chip:active { background: var(--lv-lp-accent-soft); color: var(--lv-lp-accent); border-color: var(--lv-lp-accent); }
.lv-sheet-quick-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin: 2px 0 8px; }
.lv-sheet-quick-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; min-height: 54px; padding: 8px 3px 7px; border-radius: 12px; background: var(--lv-lp-card-bg); border: 1px solid var(--lv-lp-border-strong); box-shadow: var(--lv-lp-card-shadow); cursor: pointer; text-align: center; font-family: inherit; -webkit-tap-highlight-color: transparent; transition: transform 0.14s ease, background-color 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease, opacity 0.14s ease; }
.lv-sheet-quick-card:active { transform: scale(0.95); background: var(--lv-lp-accent-soft); color: var(--lv-lp-accent); border-color: var(--lv-lp-accent); box-shadow: none; }
.lv-sheet-quick-card[data-busy="true"] { opacity: 0.68; pointer-events: none; }
.lv-sheet-quick-card[data-busy="true"] .lv-sheet-quick-icon { animation: lvSpin 0.8s linear infinite; }
.lv-sheet-quick-icon { font-size: 18.5px; line-height: 1; display: inline-flex; align-items: center; justify-content: center; }
.lv-sheet-quick-text { font-size: 11px; font-weight: 650; color: var(--lv-lp-text); white-space: nowrap; }
.lv-sheet-today-ticker { display: flex; align-items: center; gap: 5px; margin: 0 0 7px; overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none; }
.lv-sheet-today-ticker::-webkit-scrollbar { display: none; }
.lv-sheet-ticker-pill { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; padding: 2px 8px; border-radius: 999px; background: var(--lv-lp-panel-bg); border: 1px solid var(--lv-lp-border); color: var(--lv-lp-text-sub); font-size: 10.5px; font-family: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; white-space: nowrap; transition: transform 0.12s ease, background-color 0.12s ease, border-color 0.12s ease; }
.lv-sheet-ticker-pill:active { transform: scale(0.95); background: var(--lv-lp-accent-soft); color: var(--lv-lp-accent); border-color: var(--lv-lp-accent); }
.lv-sheet-ticker-pill.done { opacity: 0.92; background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.22); }
.lv-sheet-ticker-pill.uninstalled { opacity: 0.45; cursor: default; }
.lv-sheet-ticker-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.lv-sheet-ticker-val { font-weight: 700; font-family: monospace; color: var(--lv-lp-text); font-size: 10px; }
.lv-sheet-ticker-pill.done .lv-sheet-ticker-val { color: #10b981; }
.lv-sheet-inbox-panel { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; margin: 4px 0 8px; border-radius: 12px; background: var(--lv-lp-panel-bg); border: 1px solid var(--lv-lp-border); max-height: 240px; overflow-y: auto; }
.lv-sheet-empty { grid-column: 1 / -1; text-align: center; font-size: 13px; color: var(--lv-lp-text-sub); padding: 14px 0; }
.lv-sheet-hint { text-align: center; font-size: 11px; color: var(--lv-lp-text-sub); }
@keyframes lvSheetMaskIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes lvSheetUp { from { transform: translateY(40%); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }

/* 收场动画：下滑淡出，替代生硬的瞬间移除 */
#lv-launchpad-sheet-mask.lv-sheet-closing { animation: lvSheetMaskOut 190ms ease-in both; pointer-events: none; }
#lv-launchpad-sheet-mask.lv-sheet-closing .lv-sheet { animation: lvSheetDown 190ms ease-in both; }
@keyframes lvSheetMaskOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes lvSheetDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(55%); opacity: 0; } }
@media (min-width: 600px) {
    #lv-launchpad-sheet-mask.lv-sheet-closing .lv-sheet { animation: lvSheetCenterOut 160ms ease-in both; }
    @keyframes lvSheetCenterOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.94); opacity: 0; } }
}
@media (prefers-reduced-motion: reduce) {
    #lv-launchpad-sheet-mask, #lv-launchpad-sheet-mask .lv-sheet { animation: none; }
    /* 通知卡滑入、胶囊弹出、桌面罗盘 popover 入场：系统开启「减弱动态效果」时全部直出 */
    #lv-notice-host .lv-notice-card,
    #lv-notice-host .lv-notice-capsule,
    .lv-desktop-launchpad-popover {
        animation: none !important;
        transition: none !important;
    }
}

/* ===== 极速工作台弹窗（一键记事 / LifeLog） ===== */
.lv-qw-mask{
  --lv-lp-panel-bg:#f8fafc;--lv-lp-card-bg:#ffffff;--lv-lp-card-hover-bg:#f1f5f9;--lv-lp-border:rgba(15,23,42,.09);--lv-lp-border-strong:rgba(15,23,42,.15);--lv-lp-text:#0f172a;--lv-lp-text-sub:#64748b;--lv-lp-accent:#2563eb;--lv-lp-accent-soft:rgba(37,99,235,.1);
  position:fixed;inset:0;z-index:1095;background:rgba(15,23,42,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));box-sizing:border-box;animation:lvSheetMaskIn 180ms ease both;
}
:is([data-theme-mode="dark"],[data-appearance="dark"],body.body--dark,body.theme--dark,html.dark) .lv-qw-mask{
  --lv-lp-panel-bg:rgba(30,36,49,.82);--lv-lp-card-bg:#1e2433;--lv-lp-card-hover-bg:#283044;--lv-lp-border:rgba(255,255,255,.1);--lv-lp-border-strong:rgba(255,255,255,.16);--lv-lp-text:#f8fafc;--lv-lp-text-sub:#94a3b8;--lv-lp-accent:#60a5fa;--lv-lp-accent-soft:rgba(59,130,246,.2);
  background:rgba(0,0,0,.58);
}
.lv-qw-card{width:min(640px,94vw);max-height:92dvh;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,.14));border-radius:18px;box-shadow:0 20px 48px -8px rgba(15,23,42,.28),0 0 0 1px rgba(255,255,255,.08) inset;display:flex;flex-direction:column;overflow:hidden;color:var(--lv-lp-text,#0f172a);font-family:var(--b3-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif);animation:lvSheetCenter 200ms cubic-bezier(.22,1,.36,1) both}
.lv-qw-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:13px 16px 11px;border-bottom:1px solid var(--lv-lp-border,rgba(15,23,42,.08));flex-shrink:0}
.lv-qw-title-wrap{display:flex;align-items:center;gap:7px;min-width:0;flex-wrap:wrap}
.lv-qw-icon{font-size:16px;line-height:1}
.lv-qw-title{font-size:14px;font-weight:700;white-space:nowrap}
.lv-qw-badge{font-size:10.5px;font-weight:600;padding:2.5px 9px;border-radius:999px;background:var(--lv-lp-accent-soft,rgba(37,99,235,.1));color:var(--lv-lp-accent,#2563eb);max-width:210px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lv-qw-badge-btn{cursor:pointer;border:1px solid transparent;font-family:inherit;transition:background-color .15s ease,border-color .15s ease,transform .12s ease}
.lv-qw-badge-btn:hover{border-color:var(--lv-lp-accent);opacity:.92}
.lv-qw-badge-btn:active{transform:scale(.96)}
.lv-qw-close{background:transparent;border:none;cursor:pointer;font-size:14px;padding:4px 7px;border-radius:7px;color:var(--lv-lp-text-sub,#64748b);transition:background-color .14s ease,color .14s ease,transform .12s ease}
.lv-qw-close:hover{background:var(--lv-lp-panel-bg,#f1f5f9);color:var(--lv-lp-text,#0f172a)}
.lv-qw-close:active{transform:scale(.92)}
.lv-qw-body{padding:13px 16px;display:flex;flex-direction:column;gap:9px;overflow-y:auto;overscroll-behavior-y:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.lv-qw-categories,.lv-qw-tags-row,.lv-qw-time-offsets{display:flex;align-items:center;flex-wrap:wrap;gap:6px}
.lv-qw-tags-label{font-size:11px;color:var(--lv-lp-text-sub,#64748b);font-weight:500}
.lv-qw-cat-pill{display:inline-flex;align-items:center;position:relative}
.lv-qw-cat-chip{padding:4px 11px;border-radius:999px;border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,.12));background:var(--lv-lp-panel-bg,#f8fafc);color:var(--lv-lp-text,#0f172a);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:background-color .15s ease,border-color .15s ease,color .15s ease,transform .12s ease,box-shadow .15s ease}
.lv-qw-cat-chip:active{transform:scale(.96)}
.lv-qw-cat-chip:hover:not(.active){background:var(--lv-lp-accent-soft,rgba(37,99,235,.08));border-color:var(--lv-lp-accent,#2563eb);color:var(--lv-lp-accent,#2563eb)}
.lv-qw-cat-chip.active{background:var(--lv-lp-accent,#2563eb)!important;color:#ffffff!important;border-color:var(--lv-lp-accent,#2563eb)!important;box-shadow:0 2px 8px rgba(37,99,235,.28)}
.lv-qw-cat-chip.active:hover{background:var(--lv-lp-accent,#2563eb)!important;color:#ffffff!important;filter:brightness(1.08)}
.lv-qw-cat-del{margin-left:-16px;margin-right:2px;width:15px;height:15px;border-radius:999px;border:none;background:rgba(15,23,42,.18);color:#fff;font-size:10px;line-height:1;display:inline-grid;place-items:center;cursor:pointer;opacity:.75;transition:opacity .12s ease,background-color .12s ease}
.lv-qw-cat-del:hover{opacity:1;background:#ef4444}
.lv-qw-add-cat-btn{padding:4px 10px;border-radius:999px;border:1px dashed var(--lv-lp-border-strong,rgba(15,23,42,.22));background:transparent;color:var(--lv-lp-text-sub,#64748b);font-size:11.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:border-color .14s ease,color .14s ease,background-color .14s ease}
.lv-qw-add-cat-btn:hover{border-color:var(--lv-lp-accent,#2563eb);color:var(--lv-lp-accent,#2563eb);background:var(--lv-lp-accent-soft,rgba(37,99,235,.06))}
.lv-qw-add-cat-row{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:9px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border-strong)}
.lv-qw-add-cat-input{flex:1;min-width:0;padding:4px 8px;border-radius:6px;border:1px solid var(--lv-lp-border-strong);background:var(--lv-lp-card-bg);color:var(--lv-lp-text);font-size:12px;font-family:inherit}
.lv-qw-add-cat-input:focus{outline:none;border-color:var(--lv-lp-accent)}
.lv-qw-nb-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 9px;border-radius:9px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);font-size:11.5px}
.lv-qw-nb-select{flex:1;min-width:0;padding:4px 8px;border-radius:6px;border:1px solid var(--lv-lp-border-strong);background:var(--lv-lp-card-bg);color:var(--lv-lp-text);font-size:11.5px;font-family:inherit;cursor:pointer}
.lv-qw-custom-doc-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 9px;border-radius:9px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);font-size:11.5px}
.lv-qw-custom-doc-name{flex:1;min-width:0;font-weight:600;color:var(--lv-lp-accent,#2563eb);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lv-qw-custom-doc-btns{display:flex;align-items:center;gap:5px;flex-shrink:0}
.lv-qw-attach-bar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;padding:6px 0 2px;border-top:1px dashed var(--lv-lp-border,rgba(15,23,42,.1))}
.lv-qw-attach-triggers{display:flex;align-items:center;gap:5px}
.lv-qw-link-mode-group{display:inline-flex;align-items:center;gap:2px;padding:2px;border-radius:999px;background:var(--lv-lp-panel-bg,#f1f5f9);border:1px solid var(--lv-lp-border,rgba(15,23,42,.1))}
.lv-qw-mode-pill{padding:2px 7px;border:none;border-radius:999px;font-size:10px;font-weight:600;color:var(--lv-lp-text-sub,#64748b);background:transparent;cursor:pointer;transition:all .12s ease}
.lv-qw-mode-pill:hover:not(.is-active){color:var(--lv-lp-accent,#2563eb)}
.lv-qw-mode-pill.is-active{background:var(--lv-lp-card-bg,#fff);color:var(--lv-lp-accent,#2563eb);box-shadow:0 1px 3px rgba(0,0,0,.1)}
.lv-qw-attach-list{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0;max-height:110px;overflow-y:auto}
.lv-qw-attach-chip{display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,.12));font-size:11px}
.lv-qw-attach-thumb{width:22px;height:22px;object-fit:cover;border-radius:4px;flex-shrink:0}
.lv-qw-attach-name{max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
.lv-qw-attach-size{color:var(--lv-lp-text-sub);font-size:9.5px}
.lv-qw-item-mode-btn{padding:1px 5px;font-size:9.5px;font-weight:600;border-radius:4px;background:var(--lv-lp-accent-soft);color:var(--lv-lp-accent);border:none;cursor:pointer}
.lv-qw-attach-remove{border:none;background:transparent;color:var(--lv-lp-text-sub);cursor:pointer;font-size:11px;padding:0 2px}
.lv-qw-attach-remove:hover{color:#ef4444}
.lv-qw-doc-picker-modal{position:absolute;top:50px;left:14px;right:14px;z-index:25;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong);border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.22);padding:10px;display:flex;flex-direction:column;gap:8px;animation:lvFadeIn .15s ease}
.lv-qw-doc-search-input{width:100%;box-sizing:border-box;padding:6px 10px;font-size:12.5px;border:1px solid var(--lv-lp-border-strong);border-radius:8px;background:var(--lv-lp-panel-bg);color:var(--lv-lp-text)}
.lv-qw-doc-results{max-height:180px;overflow-y:auto;display:flex;flex-direction:column;gap:4px}
.lv-qw-doc-item{display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-radius:6px;cursor:pointer;font-size:12px;border:none;background:transparent;text-align:left;color:var(--lv-lp-text);width:100%}
.lv-qw-doc-item:hover{background:var(--lv-lp-accent-soft);color:var(--lv-lp-accent)}
.lv-qw-textarea.is-dragover{border-color:var(--lv-lp-accent,#2563eb);box-shadow:0 0 0 3px var(--lv-lp-accent-soft,rgba(37,99,235,.2))}
.lv-qw-tag-chip{padding:3px 8px;border-radius:6px;border:1px solid var(--lv-lp-border,rgba(15,23,42,.1));background:var(--lv-lp-panel-bg,#f8fafc);color:var(--lv-lp-text,#0f172a);font-size:11px;cursor:pointer;font-family:inherit;transition:background-color .12s ease,border-color .12s ease,color .12s ease,transform .1s ease}
.lv-qw-tag-chip:active,.lv-qw-time-chip:active{transform:scale(.95)}
.lv-qw-tag-chip:not([style*="color"]):hover{background:var(--lv-lp-accent-soft,rgba(37,99,235,.1));border-color:var(--lv-lp-accent,#2563eb);color:var(--lv-lp-accent,#2563eb)}
.lv-qw-time-chip{padding:2.5px 7px;border-radius:5px;border:1px solid var(--lv-lp-border,rgba(15,23,42,.08));background:var(--lv-lp-card-bg,#fff);color:var(--lv-lp-text-sub,#64748b);font-size:10.5px;cursor:pointer;font-family:inherit;transition:background-color .12s ease,border-color .12s ease,color .12s ease}
.lv-qw-time-chip:not(.active):hover{background:var(--lv-lp-accent-soft,rgba(37,99,235,.1));border-color:var(--lv-lp-accent,#2563eb);color:var(--lv-lp-accent,#2563eb)}
.lv-qw-time-chip.active{background:var(--lv-lp-accent,#2563eb)!important;border-color:var(--lv-lp-accent,#2563eb)!important;color:#ffffff!important;font-weight:600}
.lv-qw-time-chip.active:hover{background:var(--lv-lp-accent,#2563eb)!important;color:#ffffff!important;filter:brightness(1.08)}
.lv-qw-textarea{width:100%;box-sizing:border-box;min-height:120px;max-height:260px;resize:vertical;border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.65;font-family:inherit;border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,.14));background:var(--lv-lp-card-bg,#fff);color:var(--lv-lp-text,#0f172a);transition:border-color .15s ease,box-shadow .15s ease}
.lv-qw-textarea:focus{outline:none;border-color:var(--lv-lp-accent,#2563eb);box-shadow:0 0 0 3px var(--lv-lp-accent-soft,rgba(37,99,235,.15))}
.lv-qw-preview-tag,.lv-qw-draft-hint,.lv-qw-recent-strip{font-size:11px;color:var(--lv-lp-text-sub,#64748b);padding:4.5px 9px;border-radius:7px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px dashed var(--lv-lp-border,rgba(15,23,42,.1))}
.lv-qw-draft-hint{display:flex;align-items:center;justify-content:space-between;font-size:10.5px}
.lv-qw-recent-strip{display:flex;align-items:center;gap:6px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:10.5px}
.lv-qw-recent-strip .lv-qw-strip-text{flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;min-width:0}
.lv-qw-undo-btn{flex-shrink:0;border:none;cursor:pointer;font-size:10.5px;font-weight:650;padding:2px 8px;border-radius:6px;background:var(--lv-lp-accent-soft,rgba(37,99,235,.12));color:var(--lv-lp-accent,#2563eb);font-family:inherit;-webkit-tap-highlight-color:transparent;transition:transform .12s ease,opacity .12s ease}
.lv-qw-undo-btn:hover{background:var(--lv-lp-accent-soft,rgba(37,99,235,.22));color:var(--lv-lp-accent,#2563eb)}
.lv-qw-cat-count{opacity:.72;font-weight:600}
.lv-restore-warn{font-size:11.5px;line-height:1.55;color:var(--lv-lp-text,#0f172a);background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);padding:7px 10px;border-radius:8px}
.lv-restore-pick{display:flex;align-items:center;gap:6px}
.lv-restore-summary{display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:var(--lv-lp-text,#0f172a);background:var(--lv-lp-panel-bg,#f8fafc);border:1px dashed var(--lv-lp-border,rgba(15,23,42,.1));padding:7px 10px;border-radius:8px}
.lv-qw-attach-strip{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:6px 8px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px dashed var(--lv-lp-border,rgba(15,23,42,.1))}
.lv-qw-attach-thumb{position:relative;width:56px;height:56px;border-radius:9px;overflow:hidden;border:1.5px solid var(--lv-lp-border-strong,rgba(15,23,42,.14));background:var(--lv-lp-panel-bg,#f1f5f9);flex-shrink:0;cursor:pointer;transition:transform .14s ease,box-shadow .14s ease}
.lv-qw-attach-thumb:hover{transform:translateY(-1px);box-shadow:0 4px 10px rgba(0,0,0,.12)}
.lv-qw-attach-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.lv-qw-attach-del{position:absolute;top:0;right:0;width:22px;height:22px;border:none;border-radius:0 0 0 8px;background:rgba(15,23,42,.72);color:#fff;font-size:13px;font-weight:700;line-height:20px;padding:0;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;transition:background .15s ease}
.lv-qw-attach-del:hover{background:#ef4444}
.lv-qw-attach-del:active{transform:scale(.88)}
.lv-qw-attach-thumb.lv-qw-attach-busy{display:flex;align-items:center;justify-content:center}
.lv-qw-attach-thumb.lv-qw-attach-busy::after{content:"";width:18px;height:18px;border-radius:50%;border:2px solid var(--lv-lp-accent,#2563eb);border-top-color:transparent;animation:lvSpin .8s linear infinite}
.lv-qw-attach-actions{display:flex;align-items:center;gap:6px;margin-top:4px}
.lv-qw-draft-clear{border:none;background:transparent;color:var(--lv-lp-accent,#2563eb);cursor:pointer;font-size:10.5px;padding:0 2px;font-weight:600}
.lv-qw-preview-text{font-weight:600;color:var(--lv-lp-text,#0f172a)}
.lv-qw-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:10px 16px 13px;border-top:1px solid var(--lv-lp-border,rgba(15,23,42,.08));font-size:11px;color:var(--lv-lp-text-sub,#64748b);flex-shrink:0}
.lv-qw-tip-wrap{display:flex;align-items:center;gap:8px;min-width:0}
.lv-qw-char-count{font-variant-numeric:tabular-nums;opacity:.85}
.lv-qw-actions{display:flex;gap:7px;margin-left:auto}
.lv-qw-btn{padding:6px 13px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,.12));background:var(--lv-lp-panel-bg,#f8fafc);color:var(--lv-lp-text,#0f172a);transition:background-color .15s ease,border-color .15s ease,transform .12s ease,opacity .15s ease,color .15s ease,filter .15s ease,box-shadow .15s ease}
.lv-qw-btn:not(.lv-qw-btn-primary):not(.lv-qw-btn-secondary):hover:not(:disabled){background:var(--lv-lp-card-hover-bg,#f1f5f9);color:var(--lv-lp-text,#0f172a);border-color:var(--lv-lp-border-strong,rgba(15,23,42,.25))}
.lv-qw-btn:active:not(:disabled){transform:scale(.96)}
.lv-qw-btn:disabled{opacity:.58;cursor:not-allowed}
.lv-qw-btn-secondary{color:var(--lv-lp-accent,#2563eb);border-color:color-mix(in srgb,var(--lv-lp-accent,#2563eb) 35%,var(--lv-lp-border-strong));background:var(--lv-lp-accent-soft,rgba(37,99,235,.08))}
.lv-qw-btn-secondary:hover:not(:disabled){background:var(--lv-lp-accent-soft,rgba(37,99,235,.18))!important;color:var(--lv-lp-accent,#2563eb)!important;border-color:var(--lv-lp-accent,#2563eb)!important;box-shadow:0 1px 4px rgba(37,99,235,.15)}
.lv-qw-btn-primary{background:var(--lv-lp-accent,#2563eb)!important;color:#ffffff!important;border-color:var(--lv-lp-accent,#2563eb)!important;box-shadow:0 2px 6px rgba(37,99,235,.2)}
.lv-qw-btn-primary:hover:not(:disabled){background:var(--lv-lp-accent,#2563eb)!important;color:#ffffff!important;border-color:var(--lv-lp-accent,#2563eb)!important;filter:brightness(1.08);box-shadow:0 4px 12px rgba(37,99,235,.32);transform:translateY(-1px)}
.lv-doc-recycle-btn:hover{background:rgba(239,68,68,.14)!important;color:#ef4444!important;border-color:rgba(239,68,68,.35)!important}
.lv-group-recycle-btn:hover{background:rgba(239,68,68,.16)!important;color:#ef4444!important;border-color:rgba(239,68,68,.4)!important}
.lv-set-keep-btn:hover,.lv-group-diff-btn:hover,.lv-doc-snippet-btn:hover,.lv-doc-jump-btn:hover,.lv-doc-more-btn:hover,.lv-block-locate-btn:hover,.lv-block-single-dedup-btn:hover,.lv-export-audit-btn:hover{background:var(--lv-lp-accent-soft,rgba(37,99,235,.18))!important;color:var(--lv-lp-accent,#2563eb)!important;border-color:var(--lv-lp-accent,#2563eb)!important}
.lv-recycle-all-conflicts-btn:hover,.lv-clean-lifelog-btn:hover,.lv-recycle-clip-group-btn:hover,.lv-toggle-empty-filter-btn:hover{background:rgba(239,68,68,.14)!important;color:#ef4444!important;border-color:rgba(239,68,68,.35)!important}
.lv-qw-btn:focus-visible,.lv-qw-cat-chip:focus-visible,.lv-qw-tag-chip:focus-visible,.lv-qw-time-chip:focus-visible,.lv-qw-close:focus-visible,.lv-qw-badge-btn:focus-visible{outline:2px solid var(--lv-lp-accent,#2563eb);outline-offset:2px}
.lv-qw-btn:focus-visible,.lv-qw-cat-chip:focus-visible,.lv-qw-tag-chip:focus-visible,.lv-qw-time-chip:focus-visible,.lv-qw-close:focus-visible,.lv-qw-badge-btn:focus-visible{outline:2px solid var(--lv-lp-accent,#2563eb);outline-offset:2px}
@media (max-width:600px){
  .lv-qw-textarea,.lv-qw-add-cat-input,.lv-qw-nb-select{font-size:16px}
  .lv-qw-btn{min-height:38px;padding:7px 14px}
}
@media (max-width:480px){
  .lv-qw-card{width:96vw!important;max-width:96vw!important;border-radius:14px!important}
  .lv-qw-foot{flex-direction:column!important;align-items:stretch!important;gap:8px!important;padding:8px 12px 12px!important}
  .lv-qw-actions{width:100%!important;display:flex!important;gap:6px!important}
  .lv-qw-btn{flex:1!important;text-align:center!important;display:inline-flex!important;align-items:center!important;justify-content:center!important}
}
.lv-conflict-tab{padding:5px 12px;border-radius:7px;border:1px solid var(--lv-lp-border,rgba(15,23,42,.12));background:var(--lv-lp-panel-bg,#f8fafc);color:var(--lv-lp-text-sub,#64748b);font-size:11.5px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0;transition:background-color .15s ease,border-color .15s ease,color .15s ease,transform .12s ease}
.lv-conflict-tab:hover{background:var(--lv-lp-accent-soft,rgba(37,99,235,.08));color:var(--lv-lp-accent,#2563eb)}
.lv-conflict-tab:active{transform:scale(.96)}
.lv-conflict-tab.active{background:var(--lv-lp-accent-soft,rgba(37,99,235,.14));border-color:var(--lv-lp-accent,#2563eb);color:var(--lv-lp-accent,#2563eb)}
.lv-diff-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.lv-conflict-tab-view{-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;touch-action:pan-y}
.lv-reconcile-stat-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border,rgba(15,23,42,.1));font-size:11px;font-weight:600}
.lv-reconcile-filter-chip{padding:3px 9px;border-radius:6px;border:1px solid var(--lv-lp-border,rgba(15,23,42,.12));background:var(--lv-lp-panel-bg,#f8fafc);color:var(--lv-lp-text-sub,#64748b);font-size:11px;font-weight:600;cursor:pointer;transition:all .15s ease}
.lv-reconcile-filter-chip:hover{background:var(--lv-lp-accent-soft,rgba(37,99,235,.08));color:var(--lv-lp-accent,#2563eb)}
.lv-reconcile-filter-chip.active{background:var(--lv-lp-accent-soft,rgba(37,99,235,.14));border-color:var(--lv-lp-accent,#2563eb);color:var(--lv-lp-accent,#2563eb)}
@media (max-width:560px){
  .lv-diff-grid{grid-template-columns:1fr!important}
}
@media (max-width:600px){
  .lv-conflict-tab-view{max-height:calc(85dvh - 150px)!important}
}
.lv-cfg-container{display:flex;width:100%;height:100%;min-height:0}
.lv-cfg-sidebar{width:184px;flex-shrink:0;border-right:1px solid var(--lv-lp-border,rgba(15,23,42,.08));background:var(--lv-lp-panel-bg,#f8fafc);display:flex;flex-direction:column;padding:10px 8px;gap:4px;overflow-y:auto;box-sizing:border-box}
.lv-cfg-tab-btn{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:7px;font-size:12.5px;font-weight:500;color:var(--lv-lp-text-sub,#64748b);background:transparent;border:1px solid transparent;cursor:pointer;text-align:left;transition:all .15s ease;user-select:none;font-family:inherit}
.lv-cfg-tab-btn:hover{background:var(--lv-lp-card-bg,#fff);color:var(--lv-lp-text,#0f172a);border-color:var(--lv-lp-border,rgba(15,23,42,.08))}
.lv-cfg-tab-btn.active{background:var(--lv-lp-accent-soft,rgba(37,99,235,.12));color:var(--lv-lp-accent,#2563eb);font-weight:600;border-color:rgba(37,99,235,.2)}
.lv-cfg-panel{flex:1 1 auto;min-width:0;min-height:0;padding:16px 22px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;font-size:12.5px;color:var(--lv-lp-text,#0f172a);box-sizing:border-box}
@media (max-width:600px){
  .lv-cfg-container{flex-direction:column!important}
  .lv-cfg-sidebar{width:100%!important;flex-direction:row!important;overflow-x:auto!important;border-right:none!important;border-bottom:1px solid var(--lv-lp-border,rgba(15,23,42,.08))!important;padding:6px!important;white-space:nowrap!important}
  .lv-cfg-tab-btn{padding:6px 10px!important;font-size:12px!important}
  .lv-cfg-panel{padding:12px 14px!important}
}

/* ===== 设备矩阵适配：平板 / 折叠屏内屏（≥600px）底部抽屉 → 居中悬浮卡片 ===== */
@media (min-width: 600px) {
    #lv-launchpad-sheet-mask { align-items: center; padding: 24px; box-sizing: border-box; }
    #lv-launchpad-sheet-mask .lv-sheet {
        max-width: 560px;
        width: auto;
        min-width: min(420px, 92vw);
        border-radius: 20px;
        max-height: 82dvh;
        animation: lvSheetCenter 200ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .lv-sheet-handle { display: none; }
}
@keyframes lvSheetCenter { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* 手机横屏矮窗：紧凑布局，隐藏提示行让位内容 */
@media (orientation: landscape) and (max-height: 500px) {
    #lv-launchpad-sheet-mask .lv-sheet { max-height: 92dvh; padding-top: 8px; }
    .lv-sheet-grid { gap: 8px; }
    .lv-sheet-hint { display: none; }
}

/* 触控目标防误触：禁双击缩放，磁贴/行动 chips/结果行/关闭键统一 */
.lv-sheet-tile, .lv-sheet-action-chip, .lv-sheet-result, .lv-sheet-close, .lv-sheet-moon, .lv-sheet-today-chip { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }

/* ===== 今日一站式聚合条：各插件徽记数字一眼总览，点 chip 直达 ===== */
.lv-sheet-today { display: flex; align-items: center; gap: 6px; overflow-x: auto; margin: 0 0 8px; padding: 5px 8px; border-radius: 11px; background: var(--lv-lp-accent-soft); border: 1px solid color-mix(in srgb, var(--lv-lp-accent) 16%, transparent); overscroll-behavior-x: contain; scrollbar-width: none; }
.lv-sheet-today::-webkit-scrollbar { display: none; }
.lv-sheet-today-label { flex-shrink: 0; font-size: 11.5px; font-weight: 700; color: var(--lv-lp-accent); }
.lv-sheet-today-chip {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-card-bg);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
    border-radius: 999px;
    padding: 3.5px 10px;
    font-size: 12px;
    font-weight: 600;
    color: var(--lv-lp-text);
    cursor: pointer;
}
.lv-sheet-today-chip:active { transform: scale(0.96); }
.lv-sheet-today-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--lv-lp-accent); }

/* ===== 专注模式：坞头 🌙 开关 + 入口徽记 ===== */
.lv-sheet-moon {
    border: 1px solid var(--lv-lp-border);
    background: var(--lv-lp-card-bg);
    font-size: 11.5px;
    line-height: 1;
    height: 32px;
    min-width: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 9px;
    border-radius: 999px;
    color: var(--lv-lp-text);
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: transform 0.12s ease, background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease;
}
.lv-sheet-moon:active { transform: scale(0.95); }
.lv-sheet-moon[aria-pressed="true"] {
    background: var(--lv-lp-accent-soft);
    border-color: color-mix(in srgb, var(--lv-lp-accent) 30%, transparent);
    color: var(--lv-lp-accent);
    font-weight: 600;
}
/* Keep compact visuals while giving phone actions their own usable hit areas. */
#lv-launchpad-sheet-mask button,
#lv-launchpad-sheet-mask .lv-sheet-search {
    min-height: 40px;
}
#lv-launchpad-sheet-mask .lv-sheet-close { width: 44px; height: 44px; min-width: 44px; min-height: 44px; }
#lv-launchpad-sheet-mask .lv-sheet-moon { min-width: 40px; min-height: 40px; padding: 0 10px; }
#lv-launchpad-sheet-mask .lv-sheet-search { font-size: 16px; height: 42px; }
#lv-launchpad-sheet-mask .lv-sheet-action-chip { min-width: 44px; min-height: 40px; }
#lv-launchpad-sheet-mask .lv-sheet-search-clear { width: 36px; height: 36px; min-height: 36px !important; }
#lv-launchpad-sheet-mask .lv-sheet-inbox-panel select,
#lv-launchpad-sheet-mask .lv-sheet-inbox-panel input,
#lv-launchpad-sheet-mask .lv-sheet-inbox-panel button,
#lv-launchpad-sheet-mask .lv-sheet-community-bar button {
    min-height: 44px;
    box-sizing: border-box;
}
#lv-launchpad-sheet-mask .lv-sheet.lv-sheet-dragging { will-change: transform; }
@media (max-width: 600px) {
    #lv-launchpad-sheet-mask select,
    #lv-launchpad-sheet-mask input { font-size: 16px !important; }
}
@media (prefers-reduced-motion: reduce) {
    #lv-launchpad-mobile-ball { transition: none; }
}

.b3-menu__item svg {
    max-width: 16px !important;
    max-height: 16px !important;
    flex-shrink: 0 !important;
}
.b3-menu__icon {
    width: 14px !important;
    height: 14px !important;
    max-width: 16px !important;
    max-height: 16px !important;
    flex-shrink: 0 !important;
}
html[data-lv-motion="off"] #lv-notice-host,
html[data-lv-motion="off"] #lv-notice-host *,
html[data-lv-motion="off"] #lv-quick-workspace-mask,
html[data-lv-motion="off"] #lv-quick-workspace-mask *,
html[data-lv-motion="off"] #lv-launchpad-sheet-mask,
html[data-lv-motion="off"] #lv-launchpad-sheet-mask *,
html[data-lv-motion="off"] #lv-ai-wait-overlay-mask,
html[data-lv-motion="off"] #lv-ai-wait-overlay-mask *,
html[data-lv-motion="off"] .lv-ai-wait-mask,
html[data-lv-motion="off"] .lv-ai-wait-mask *,
html[data-lv-motion="off"] .lv-ai-thinking,
html[data-lv-motion="off"] .lv-ai-thinking *,
html[data-lv-motion="off"] #lv-launchpad-mobile-ball {
    animation: none !important;
    transition: none !important;
}`;function Ro(H){let q=H.window,C=H.document,We=H.localStorage,ae=H.Date||globalThis.Date,Ua=H.location,Ue=H.navigator,gt=H.fetch,Pe=H.setTimeout,Oe=H.clearTimeout,Ga=H.setInterval,Ya=H.clearInterval,Va=H.requestAnimationFrame,Qa=H.cancelAnimationFrame,tn=H.CustomEvent,Re=H.Event,Oo=H.PROTOCOL_VERSION??200,dt=H.getTodayKey,et=H.getSafeLocalStorage,v=H.escapeHtml,Ge=H.lvSurfaceStack,Fn=H.withDocLock,nn=H.getNotifyFocusUntil,bt=H.isNotifyFocusActive,on=H.setNotifyFocusUntil,an=H.clearNotifyFocus,N=H.lvNotify,Kn=H.persistSecretToSiyuanSlot,jo=H.getAiHub,yt=H.getActivityHub,ln=H.lvActivity,rn=H.lvBackup,Je=H.LV_FEEDBACK_QQ_GROUP,Pt=H.LV_FEEDBACK_EMAIL,Wn=H.openJoinQqGroup,Rt=H.lvEcosystem,Un=H.getReconciliationWhitelist,Fo=H.saveReconciliationWhitelist,Ko=H.addReconciliationWhitelist,Gn=H.removeReconciliationWhitelist,Wo=H.isReconciliationWhitelisted,sn=H.formatSyTimestamp,Uo=H.formatBlockType,Go=H.isBenignHomonymTitle,Yo=()=>H.getLvAiJudge(),cn=new Proxy({},{get(t,e){let n=Yo(),o=n?.[e];return typeof o=="function"?o.bind(n):o}}),Yn=H.getLaunchpadStates,Vn=H.restoreAllHiddenPlugins,Ne=H.getLaunchpadHub,Za=H.MOBILE_ENTRY_ID,Vo=H.DESKTOP_ENTRY_ID,at=H.MOBILE_SHEET_ID,tt=H.isMobileFrontend,oe=H.hapticFeedback,xt=H.getMobileEntryMode,dn=H.setMobileEntryMode,Ye=H.refreshEntryBadgeDot,Et=H.getLaunchpadRuntimeBag,pt=H.syncTopBarConvergence,Qo=H.DESKTOP_POPOVER_ID,Zo=H.resetPopoverPressGuard,Qn=H.lvPopoverSafeSwap,Jo=H.getLaunchpadViewMode,Xo=H.setLaunchpadViewMode,ea=H.getLaunchpadActionLimit,ta=H.setLaunchpadActionLimit,na=H.isDesktopPopoverOpen,Se=H.closeDesktopLaunchpadPopover,oa=(...t)=>H.getAiHubUi?.()?.buildAiWaterfallFlowchartHtml?.(...t)??"",aa=(...t)=>H.getAiHubUi?.()?.buildAiTierCardsHtml?.(...t)??"",la=H.recomputeBallSuppression,Ja=H.wireMobileSuppression,ia=H.armSheetHistory,$e=H.closeMobileSheet,Zn=H.getSearchHistory,pn=H.pushSearchHistory,Jn=H.getRecentTileIds,Ve=H.pushRecentTileId,Xn=H.resolveIconHref,_t=H.dismissActiveMobilePluginDialogs,Xa=H.showMessage,un=H.DEFAULT_LIFELOG_CATEGORIES,Qe=H.getQuickWorkspaceConfig,ze=H.saveQuickWorkspaceConfig,se=H.lvKernelPost,eo=H.createSafeAbortController,to=(...t)=>H.mountLvAiThinkingCard(...t),ra=H.getCategoryEmoji,ht=H.getCurrentOpenDocInfo,lt=H.listOpenNotebooks,Ot=H.resolveDailyNotebookId,Ze=H.openDocumentById,sa=H.openBlockById,no=H.getXiaolvDiaryZoneConfig,oo=H.setXiaolvDiaryZoneConfig,ca=H.escapeKitIalValue,ao=H.buildXiaolvLifeLogAttrs,jt=H.getDailyNoteBucket,lo=H.invalidateTodayDailyNoteCache,Ft=H.escapeSql,io=H.parseKitIalMap,da=H.parseXiaolvLifeLogBlock,pa=H.formatXiaolvLifeLogText,ua=H.formatXiaolvLifeLogMarkdown,ro=H.lvOmnisearch,Kt=H.lvAutomation,va=H.customConfigSections,so=H.showDocTreeNativeMenu,fa=H.sanitizeFileNameSegment,je=H.lvBlockAssistant,el=H.getDoubleClickActionId,tl=H.setDoubleClickActionId,vn=H.getTodaySummary,co=H.syncEntryOpenState,ga=H.safeRequire||(()=>null),ba=H.queryActiveProtyle||(()=>null),fn=()=>{H.ensureStyles?.(),H.injectChunkStyles?.("lv-kit-compass",Fa)};fn();function po(){if(typeof C>"u"||!C.head||typeof C.createElement!="function")return;let t=`
.lv-desktop-launchpad-popover {
  --lv-lp-bg: linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  --lv-lp-panel-bg: #f8fafc;
  --lv-lp-card-bg: #ffffff;
  --lv-lp-card-hover-bg: #ffffff;
  --lv-lp-border: rgba(15, 23, 42, 0.075);
  --lv-lp-border-strong: rgba(15, 23, 42, 0.12);
  --lv-lp-text: #0f172a;
  --lv-lp-text-sub: #64748b;
  --lv-lp-accent: #2563eb;
  --lv-lp-accent-soft: rgba(37, 99, 235, 0.09);
  --lv-lp-card-shadow: 0 2px 6px -1px rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  --lv-lp-icon-inset: inset 0 1px 0 rgba(255, 255, 255, 0.65);
  --lv-lp-icon-inset-hover: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  font-family: var(--b3-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif);
  color: var(--lv-lp-text);
  background: var(--lv-lp-bg) !important;
  border: 1px solid var(--lv-lp-border-strong) !important;
  border-radius: 18px;
  box-shadow: 0 24px 56px -12px rgba(15, 23, 42, 0.18), 0 8px 20px -6px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(14px) saturate(190%);
  -webkit-backdrop-filter: blur(14px) saturate(190%);
  transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  animation: lvPopoverEnter 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
  box-sizing: border-box;
}
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark) .lv-desktop-launchpad-popover {
  --lv-lp-bg: linear-gradient(165deg, rgba(24, 28, 38, 0.97) 0%, rgba(15, 18, 26, 0.98) 100%);
  --lv-lp-panel-bg: rgba(30, 36, 49, 0.76);
  --lv-lp-card-bg: rgba(33, 39, 53, 0.92);
  --lv-lp-card-hover-bg: rgba(40, 47, 64, 0.98);
  --lv-lp-border: rgba(255, 255, 255, 0.085);
  --lv-lp-border-strong: rgba(255, 255, 255, 0.14);
  --lv-lp-text: #f8fafc;
  --lv-lp-text-sub: #94a3b8;
  --lv-lp-accent: #60a5fa;
  --lv-lp-accent-soft: rgba(59, 130, 246, 0.18);
  --lv-lp-card-shadow: 0 4px 12px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  --lv-lp-icon-inset: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  --lv-lp-icon-inset-hover: inset 0 1px 0 rgba(255, 255, 255, 0.18);
  box-shadow: 0 28px 60px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}`,e=C.getElementById("lv-launchpad-desktop-styles");try{let n=e??C.createElement("style");if(e&&e.getAttribute?.("data-lv-ver")==="3.4")return;n.id="lv-launchpad-desktop-styles",n.setAttribute?.("data-lv-ver","3.4"),n.textContent=t+`
#toolbar > :is([id^="plugin_siyuan-"], [id^="plugin_xiaolv-"]):not([data-lv-pinned="true"]):is(
  [id*="checkin"], [id*="home"], [id*="contacts"], [id*="glean"],
  [id*="lv-cards"], [id*="exam"], [id*="speed-switch"], [id*="common"]
) {
  display: none !important;
}
html[data-lv-motion="off"] .lv-desktop-launchpad-popover,
html[data-lv-motion="off"] .lv-desktop-launchpad-popover *,
html[data-lv-motion="off"] #lvLaunchpadDesktopEntry,
html[data-lv-motion="off"] #lvLaunchpadMobileEntry {
  animation: none !important;
  transition: none !important;
}
#lvLaunchpadDesktopEntry {
  display: inline-flex !important;
  position: relative;
  flex-shrink: 0;
}
#lvLaunchpadMobileEntry {
  position: relative;
}
#lvLaunchpadDesktopEntry,
#lvLaunchpadMobileEntry {
  transition: transform 0.14s ease, background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}
/* LPM-1（2026-11-25 性能优化）：模态弹窗打开期间隐藏移动罗盘入口。
   改用 wireMobileSuppression 显式挂载 .lv-entry-suppressed 类名，彻底清零根级 CSS has 选择器样式失效风暴。 */
#lvLaunchpadMobileEntry.lv-entry-suppressed {
  opacity: 0 !important;
  pointer-events: none !important;
  visibility: hidden !important;
}
#lvLaunchpadDesktopEntry:active,
#lvLaunchpadMobileEntry:active {
  transform: scale(0.91);
}
#lvLaunchpadDesktopEntry.lv-entry-open,
#lvLaunchpadMobileEntry.lv-entry-open {
  background: var(--b3-theme-primary-lightest, rgba(37, 99, 235, 0.14)) !important;
  color: var(--b3-theme-primary, #2563eb) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--b3-theme-primary, #2563eb) 32%, transparent);
}
.lv-desktop-launchpad-popover * {
  box-sizing: border-box;
}
.lv-desktop-launchpad-popover.lv-popover-settled {
  animation: none !important;
}
@keyframes lvPopoverEnter {
  from { opacity: 0; transform: translateY(-8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.lv-desktop-launchpad-popover.lv-popover-closing {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
  pointer-events: none;
}
.lv-pop-sub-btn:focus-visible,
.lv-pop-view-tab:focus-visible,
.lv-pop-quick-pill:focus-visible,
.lv-pop-tile:focus-visible,
.lv-pop-action-row:focus-visible,
.lv-pop-hit-item:focus-visible,
.lv-pop-ticker-pill:focus-visible,
.lv-pop-strip-chip:focus-visible,
.lv-pop-pin-btn:focus-visible,
.lv-pop-close-btn:focus-visible,
.lv-pop-search-clear:focus-visible {
  outline: 2px solid var(--lv-lp-accent);
  outline-offset: 2px;
}
.lv-pop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 10px 12px 9px;
  border-bottom: 1px solid var(--lv-lp-border);
  background: var(--lv-lp-card-bg);
  flex-shrink: 0;
}
.lv-pop-view-tabs {
  display: inline-flex;
  background: var(--lv-lp-panel-bg);
  border: 1px solid var(--lv-lp-border);
  border-radius: 7px;
  padding: 2px;
}
.lv-pop-view-tab {
  border: none;
  background: transparent;
  color: var(--lv-lp-text-sub);
  font-size: 11px;
  padding: 2.5px 6px;
  border-radius: 5px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.14s ease, color 0.14s ease, box-shadow 0.14s ease;
}
.lv-pop-view-tab.active {
  background: var(--lv-lp-card-bg);
  color: var(--lv-lp-text);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}
.lv-pop-sub-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3.5px 7px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--lv-lp-border);
  background: var(--lv-lp-card-bg);
  color: var(--lv-lp-text);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
  font-family: inherit;
  transition: transform 0.14s ease, background 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease, color 0.14s ease;
  user-select: none;
}
.lv-pop-header .lv-pop-sub-btn {
  padding: 3px 6px;
}
.lv-pop-footer .lv-pop-sub-btn {
  padding: 3px 6px;
  gap: 3px;
}
.lv-pop-sub-btn:hover,
.lv-pop-sub-btn.active {
  border-color: var(--lv-lp-accent);
  color: var(--lv-lp-accent);
  background: var(--lv-lp-accent-soft);
}
.lv-pop-sub-btn:active,
.lv-pop-view-tab:active,
.lv-pop-strip-chip:active,
.lv-pop-action-row:active,
.lv-pop-hit-item:active {
  transform: scale(0.96);
}
.lv-pop-grid,
.lv-pop-list,
.lv-pop-pref-drawer,
.lv-pop-omni-results {
  scrollbar-width: thin;
  overscroll-behavior: contain;
}
.lv-pop-search-bar {
  margin: 2px 14px 4px;
  padding: 3.5px 9px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--lv-lp-border);
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--lv-lp-panel-bg);
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.015);
  flex-shrink: 0;
  transition: background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}
.lv-pop-search-bar:focus-within {
  background: var(--lv-lp-card-bg);
  border-color: var(--lv-lp-accent);
  box-shadow: 0 0 0 2px var(--lv-lp-accent-soft);
}
.lv-pop-search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-size: 11.5px;
  color: var(--lv-lp-text);
  font-family: inherit;
}
.lv-pop-search-input::placeholder {
  color: var(--lv-lp-text-sub);
}
.lv-pop-search-clear {
  display: none;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: none;
  background: var(--lv-lp-border);
  color: var(--lv-lp-text-sub);
  font-size: 10px;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background-color 0.12s ease, color 0.12s ease, transform 0.1s ease;
}
.lv-pop-search-clear.visible {
  display: inline-flex;
}
.lv-pop-search-clear:hover {
  background: var(--lv-lp-accent-soft);
  color: var(--lv-lp-accent);
}
.lv-pop-search-clear:active {
  transform: scale(0.9);
}
.lv-pop-search-history {
  display: none;
  align-items: center;
  gap: 5px;
  margin: 0 14px 4px;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}
.lv-pop-search-history.visible {
  display: flex;
}
.lv-pop-search-history::-webkit-scrollbar { display: none; }
.lv-pop-save-toast {
  font-size: 10.5px;
  font-weight: 600;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 1.5px 8px;
  border-radius: 999px;
  opacity: 0;
  transition: opacity 0.18s ease;
  pointer-events: none;
}
.lv-pop-save-toast.visible {
  opacity: 1;
}
.lv-pop-kbd {
  font-size: 10px;
  background: var(--lv-lp-card-bg);
  padding: 1.5px 5px;
  border-radius: 4px;
  border: 1px solid var(--lv-lp-border);
  color: var(--lv-lp-text-sub);
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}
.lv-pop-strip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 14px 6px;
  border-bottom: 1px solid var(--lv-lp-border);
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
  background: transparent;
}
.lv-pop-strip::-webkit-scrollbar { display: none; }
.lv-pop-strip-label {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--lv-lp-text-sub);
  white-space: nowrap;
  flex-shrink: 0;
}
.lv-pop-strip-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2.5px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  border: 1px solid var(--lv-lp-border);
  background: var(--lv-lp-card-bg);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025);
  color: var(--lv-lp-text);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  font-family: inherit;
  transition: transform 0.14s ease, background 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease, color 0.14s ease;
}
.lv-pop-strip-chip:hover {
  border-color: var(--lv-lp-accent);
  color: var(--lv-lp-accent);
  background: var(--lv-lp-accent-soft);
}
.lv-pop-tile {
  --tile-brand: #3b82f6;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 9px 8px 8px;
  border-radius: 13px;
  border: 1px solid var(--lv-lp-border);
  background: var(--lv-lp-card-bg);
  background-image: radial-gradient(96px circle at 86% 14%, color-mix(in srgb, var(--tile-brand) 9%, transparent), transparent 72%);
  box-shadow: var(--lv-lp-card-shadow);
  cursor: pointer;
  user-select: none;
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.18s ease, background-image 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  outline: none;
  min-width: 0;
}
.lv-pop-tile:hover,
.lv-pop-tile.lv-pop-tile-focused {
  background-color: var(--lv-lp-card-hover-bg);
  background-image: radial-gradient(110px circle at 85% 15%, color-mix(in srgb, var(--tile-brand) 15%, transparent), transparent 75%);
  border-color: color-mix(in srgb, var(--tile-brand) 55%, var(--lv-lp-accent));
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -6px color-mix(in srgb, var(--tile-brand) 22%, rgba(15, 23, 42, 0.1)), 0 0 0 1px color-mix(in srgb, var(--tile-brand) 45%, transparent);
}
.lv-pop-tile:active {
  transform: scale(0.97);
}
.lv-pop-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  background: linear-gradient(135deg, color-mix(in srgb, currentColor 16%, var(--lv-lp-card-bg)) 0%, color-mix(in srgb, currentColor 7%, var(--lv-lp-card-bg)) 100%);
  border: 1px solid color-mix(in srgb, currentColor 24%, transparent);
  box-shadow: 0 4px 10px -2px color-mix(in srgb, currentColor 20%, transparent), var(--lv-lp-icon-inset);
  position: relative;
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease;
  flex-shrink: 0;
}
.lv-pop-tile:hover .lv-pop-icon-wrap,
.lv-pop-tile.lv-pop-tile-focused .lv-pop-icon-wrap {
  transform: scale(1.08) translateY(-1px);
  box-shadow: 0 6px 14px -2px color-mix(in srgb, currentColor 30%, transparent), var(--lv-lp-icon-inset-hover);
}
.lv-pop-status-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid var(--lv-lp-card-bg);
  background: var(--lv-lp-accent);
}
.lv-pop-status-dot.warn { background: #f59e0b; }
.lv-pop-status-dot.error { background: #ef4444; }
.lv-pop-status-dot.success { background: #10b981; }
.lv-pop-tile.lv-pop-list-item {
  flex-direction: row;
  justify-content: space-between;
  text-align: left;
  padding: 7px 11px;
  border-radius: 10px;
}
.lv-pop-tile.lv-pop-list-item:hover,
.lv-pop-tile.lv-pop-list-item.lv-pop-tile-focused {
  transform: none;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06), 0 0 0 1px color-mix(in srgb, var(--tile-brand) 45%, var(--lv-lp-accent));
}
.lv-pop-pin-btn {
  transition: transform 0.12s ease, opacity 0.12s ease;
}
.lv-pop-tile:hover .lv-pop-pin-btn {
  opacity: 0.85 !important;
}
.lv-pop-pin-btn:hover {
  opacity: 1 !important;
  transform: scale(1.15);
  color: var(--lv-lp-accent) !important;
}
.lv-pop-badge {
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  padding: 1px 7px;
  border-radius: 999px;
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 3px;
  line-height: 1.35;
}
.lv-pop-badge.lv-badge-primary {
  background: var(--lv-lp-accent-soft);
  color: var(--lv-lp-accent);
  border: 1px solid color-mix(in srgb, var(--lv-lp-accent) 18%, transparent);
}
.lv-pop-badge.lv-badge-warn {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.24);
}
.lv-pop-badge.lv-badge-error {
  background: rgba(239, 68, 68, 0.14);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.24);
}
.lv-pop-badge.lv-badge-success {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.22);
}
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark) .lv-pop-badge.lv-badge-warn {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.28);
}
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark) .lv-pop-badge.lv-badge-error {
  background: rgba(239, 68, 68, 0.18);
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.28);
}
:is([data-theme-mode="dark"], [data-appearance="dark"], body.body--dark, body.theme--dark, html.dark) .lv-pop-badge.lv-badge-success {
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.28);
}
.lv-pop-actions-drawer {
  border-top: 1px solid var(--lv-lp-border);
  background: var(--lv-lp-panel-bg);
  padding: 5px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 0;
}
.lv-pop-action-row {
  padding: 5px 8px;
  border-radius: 8px;
  border: 1px solid var(--lv-lp-border);
  background: var(--lv-lp-card-bg);
  color: var(--lv-lp-text);
  font-size: 11.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  width: 100%;
  min-width: 0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
  transition: transform 0.14s ease, background 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease, color 0.14s ease;
}
.lv-pop-action-row:hover {
  background: var(--lv-lp-card-hover-bg);
  border-color: var(--lv-lp-accent);
  color: var(--lv-lp-accent);
  box-shadow: 0 3px 8px rgba(37, 99, 235, 0.08);
  transform: translateY(-1px);
}
.lv-pop-hit-item {
  padding: 8px 12px;
  border-radius: 9px;
  background: var(--lv-lp-card-bg);
  border: 1px solid var(--lv-lp-border);
  box-shadow: var(--lv-lp-card-shadow);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  text-align: left;
  font-family: inherit;
  transition: background 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
}
.lv-pop-hit-item:hover,
.lv-pop-hit-item.focused {
  background: var(--lv-lp-card-hover-bg);
  border-color: var(--lv-lp-accent);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}
.lv-pop-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  display: inline-block;
  margin-right: 5px;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.7);
}
.lv-pop-inbox-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  height: 14px;
  padding: 0 3.5px;
  border-radius: 999px;
  background: #ef4444;
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  margin-left: 3px;
}
.lv-pop-quick-wrap {
  margin: 8px 14px 5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-shrink: 0;
}
.lv-pop-quick-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}
.lv-pop-quick-pill {
  --pill-accent: var(--lv-lp-accent);
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 6.5px 8px;
  min-height: 35px;
  border-radius: 10px;
  background: var(--lv-lp-card-bg);
  border: 1px solid var(--lv-lp-border-strong);
  box-shadow: var(--lv-lp-card-shadow);
  color: var(--lv-lp-text);
  cursor: pointer;
  font-size: 11.5px;
  font-weight: 600;
  font-family: inherit;
  transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, color 0.16s ease, opacity 0.15s ease;
  user-select: none;
  white-space: nowrap;
}
.lv-pop-quick-pill:hover {
  background: color-mix(in srgb, var(--pill-accent) 10%, var(--lv-lp-card-bg));
  border-color: var(--pill-accent);
  color: var(--pill-accent);
  transform: translateY(-1.5px);
  box-shadow: 0 5px 14px -3px color-mix(in srgb, var(--pill-accent) 24%, transparent), 0 0 0 1px color-mix(in srgb, var(--pill-accent) 55%, transparent);
}
.lv-pop-quick-pill:active {
  transform: scale(0.96);
}
.lv-pop-quick-pill[data-busy="true"] {
  opacity: 0.72;
  pointer-events: none;
}
.lv-pop-quick-pill[data-busy="true"] .lv-quick-pill-icon {
  display: inline-block;
  animation: lvSpin 0.8s linear infinite;
}
.lv-pop-quick-pill[data-done="true"] {
  border-color: #10b981;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}
.lv-quick-note-btn { --pill-accent: #f59e0b; }
.lv-quick-lifelog-btn { --pill-accent: #6366f1; }
.lv-quick-clip-btn { --pill-accent: #06b6d4; }
.lv-quick-diary-bottom-btn { --pill-accent: #10b981; }
.lv-quick-task-mgr-btn { --pill-accent: #3b82f6; }
.lv-quick-new-task-btn { --pill-accent: #ec4899; }
.lv-quick-random-walk-btn { --pill-accent: #8b5cf6; }
.lv-quick-reload-btn { --pill-accent: #64748b; }
.lv-pop-quick-pill .lv-quick-pill-left {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}
.lv-pop-quick-pill .lv-quick-pill-icon {
  font-size: 13.5px;
  line-height: 1;
}
.lv-pop-quick-pill .lv-quick-pill-text {
  font-size: 11.5px;
  font-weight: 650;
}
.lv-pop-quick-pill .lv-quick-pill-key {
  font-size: 9px;
  font-weight: 700;
  font-family: monospace;
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--lv-lp-panel-bg);
  border: 1px solid var(--lv-lp-border);
  color: var(--lv-lp-text-sub);
  line-height: 1.2;
}
.lv-pop-today-ticker {
  margin: 2px 14px 4px;
  padding: 3px 8px;
  border-radius: 7px;
  background: var(--lv-lp-panel-bg);
  border: 1px solid var(--lv-lp-border);
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  font-size: 10.5px;
}
.lv-pop-ticker-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--lv-lp-text-sub);
  white-space: nowrap;
  flex-shrink: 0;
}
.lv-pop-ticker-pills {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.lv-pop-ticker-pills::-webkit-scrollbar { display: none; }
.lv-pop-ticker-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1.5px 7px;
  border-radius: 999px;
  background: var(--lv-lp-card-bg);
  border: 1px solid var(--lv-lp-border);
  color: var(--lv-lp-text-sub);
  font-size: 10.5px;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.12s ease, background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}
.lv-pop-ticker-pill:hover {
  border-color: var(--lv-lp-accent, #2563eb);
  color: var(--lv-lp-accent, #2563eb) !important;
  background: var(--lv-lp-accent-soft, rgba(37,99,235,0.1));
}
.lv-pop-ticker-pill:active {
  transform: scale(0.95);
}
.lv-pop-ticker-pill.done {
  opacity: 0.92;
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.22);
}
.lv-pop-ticker-pill.uninstalled {
  opacity: 0.45;
  cursor: default;
}
.lv-pop-ticker-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.lv-pop-ticker-val {
  font-size: 10px;
  font-family: monospace;
  color: var(--lv-lp-text);
}
.lv-pop-ticker-pill.done .lv-pop-ticker-val {
  color: #10b981;
}
.lv-pop-ticker-all-done {
  font-size: 10px;
  font-weight: 600;
  color: #10b981;
  white-space: nowrap;
  flex-shrink: 0;
}
.lv-pop-inbox-drawer {
  scrollbar-width: thin;
  overscroll-behavior: contain;
}
.lv-inbox-item.unread {
  background: var(--lv-lp-accent-soft) !important;
  border-color: rgba(37, 99, 235, 0.25) !important;
}
.lv-inbox-day-sep {
  font-size: 10px;
  font-weight: 700;
  color: var(--lv-lp-text-sub);
  text-align: center;
  padding: 3px 0 1px;
  letter-spacing: 0.08em;
  opacity: 0.9;
}
@media (max-width: 460px) {
  .lv-desktop-launchpad-popover .lv-pop-quick-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lv-desktop-launchpad-popover .lv-pop-today-dashboard-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .lv-desktop-launchpad-popover .lv-pop-header { flex-wrap: wrap; row-gap: 8px; }
  .lv-desktop-launchpad-popover .lv-pop-header > div:last-child { width: 100%; flex-wrap: wrap; }
  .lv-desktop-launchpad-popover .lv-pop-footer { flex-wrap: wrap; }
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
}
@media print {
  #lvLaunchpadDesktopEntry,
  #lvLaunchpadMobileEntry,
  #lv-desktop-launchpad-popover,
  #lv-launchpad-sheet-mask,
  #lv-launchpad-mobile-ball,
  #lv-notice-host,
  #lv-quick-workspace-mask,
  #lv-block-assistant-portal,
  #lv-shared-block-capsule,
  #lv-block-ai-result-card,
  #lv-block-type-picker-root,
  #lv-block-action-store-mask,
  #lv-ai-tier4-confirm-mask,
  .lv-bam,
  .lv-bam-mobile-mask,
  .lv-card-badge-pill,
  .lv-shared-ba-capsule,
  .lv-toast,
  .lv-floating-note,
  .lv-qw-mask,
  .lv-desktop-launchpad-popover {
    display: none !important;
    visibility: hidden !important;
  }
}
`,e||C.head.appendChild(n)}catch{}}let ya='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="fill:none!important;stroke:currentColor!important;" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="none"/><path d="M17.5 2.5 21.5 6.5 17.5 10.5 13.5 6.5Z" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="none"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="none"/></svg>',uo={"siyuan-checkin":'<path d="M8 2v4" fill="none"/><path d="M16 2v4" fill="none"/><rect width="18" height="18" x="3" y="4" rx="2" fill="none"/><path d="M3 10h18" fill="none"/><path d="m9 16 2 2 4-4" fill="none"/>',checkin:'<path d="M8 2v4" fill="none"/><path d="M16 2v4" fill="none"/><rect width="18" height="18" x="3" y="4" rx="2" fill="none"/><path d="M3 10h18" fill="none"/><path d="m9 16 2 2 4-4" fill="none"/>',"siyuan-speed-switch":'<rect x="3" y="3" width="18" height="18" rx="2" fill="none"/><path d="M9 3v18" fill="none"/><path d="m15.5 8-3 4.5h3l-2.5 4.5" fill="none"/>',raikiri:'<rect x="3" y="3" width="18" height="18" rx="2" fill="none"/><path d="M9 3v18" fill="none"/><path d="m15.5 8-3 4.5h3l-2.5 4.5" fill="none"/>',"siyuan-home":'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" fill="none"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none"/>',home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" fill="none"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none"/>',"siyuan-glean":'<path d="M12 7v14" fill="none"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" fill="none"/>',glean:'<path d="M12 7v14" fill="none"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" fill="none"/>',"siyuan-exam":'<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" fill="none"/><path d="m9 12 2 2 4-4" fill="none"/>',exam:'<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" fill="none"/><path d="m9 12 2 2 4-4" fill="none"/>',"siyuan-lv-cards":'<rect x="6" y="6" width="14" height="16" rx="2.5" fill="none"/><path d="M4 18V5a2.5 2.5 0 0 1 2.5-2.5H17" fill="none"/><path d="m10 14 2.2 2.2 4.3-4.4" fill="none"/>',cards:'<rect x="6" y="6" width="14" height="16" rx="2.5" fill="none"/><path d="M4 18V5a2.5 2.5 0 0 1 2.5-2.5H17" fill="none"/><path d="m10 14 2.2 2.2 4.3-4.4" fill="none"/>',"siyuan-contacts":'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="none"/><circle cx="9" cy="7" r="4" fill="none"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" fill="none"/><path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none"/>',contacts:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="none"/><circle cx="9" cy="7" r="4" fill="none"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" fill="none"/><path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none"/>',"xiaolv-common":'<rect x="4" y="3" width="16" height="18" rx="2" fill="none"/><path d="m10 10-2 2 2 2" fill="none"/><path d="m14 10 2 2-2 2" fill="none"/><path d="M9 17h6" fill="none"/>',common:'<rect x="4" y="3" width="16" height="18" rx="2" fill="none"/><path d="m10 10-2 2 2 2" fill="none"/><path d="m14 10 2 2-2 2" fill="none"/><path d="M9 17h6" fill="none"/>',"siyuan-quickgate":'<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="none"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2s-.7 6.13-6.05 11a22 22 0 0 1-3.95 2z" fill="none"/>',quickgate:'<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="none"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2s-.7 6.13-6.05 11a22 22 0 0 1-3.95 2z" fill="none"/>'},gn={"siyuan-checkin":"#f59e0b",checkin:"#f59e0b","siyuan-speed-switch":"#38bdf8",raikiri:"#38bdf8","siyuan-home":"#10b981",home:"#10b981","siyuan-glean":"#a855f7",glean:"#a855f7","siyuan-exam":"#3b82f6",exam:"#3b82f6","siyuan-lv-cards":"#f43f5e",cards:"#f43f5e","siyuan-contacts":"#f97316",contacts:"#f97316","xiaolv-common":"#14b8a6",common:"#14b8a6","siyuan-quickgate":"#06b6d4",quickgate:"#06b6d4"};function nt(t,e){return e&&/^#[0-9a-fA-F]{3,8}$/.test(e)?e:(!e||e.startsWith("var(--lv-brand"))&&gn[t]?gn[t]:"var(--b3-theme-primary)"}function Wt(t,e=16){let n=uo[t]||'<rect x="3" y="3" width="7" height="7" rx="1.5" fill="none"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="none"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="none"/>';return`<svg viewBox="0 0 24 24" width="${e}" height="${e}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="width:${e}px;height:${e}px;fill:none!important;stroke:currentColor!important;" aria-hidden="true">${n}</svg>`}function vo(t,e=16){let n=Xn(t.svgIcon);return n?`<svg viewBox="0 0 24 24" width="${e}" height="${e}" style="width:${e}px;height:${e}px;fill:none!important;stroke:currentColor!important;" aria-hidden="true"><use xlink:href="${n}" href="${n}"></use></svg>`:Wt(t.id,e)}async function qt(t){if(!t)return!1;try{if(typeof Ue<"u"&&Ue.clipboard&&typeof Ue.clipboard.writeText=="function")return await Ue.clipboard.writeText(t),!0}catch{}try{let e=ga("electron");if(e?.clipboard&&typeof e.clipboard.writeText=="function")return e.clipboard.writeText(t),!0}catch{}try{if(typeof C<"u"&&C.body){let e=C.createElement("textarea");e.value=t,e.style.position="fixed",e.style.opacity="0",C.body.appendChild(e),e.select();let n=C.execCommand("copy");return e.remove(),n}}catch{}return!1}function fo(t){let e=new ae(t),n=new ae,o=e.toDateString()===n.toDateString(),r=String(e.getHours()).padStart(2,"0"),l=String(e.getMinutes()).padStart(2,"0");return o?`${r}:${l}`:`${e.getMonth()+1}/${e.getDate()} ${r}:${l}`}function xa(t){let e=new ae(t),n=new ae,o=(l,c)=>l.getFullYear()===c.getFullYear()&&l.getMonth()===c.getMonth()&&l.getDate()===c.getDate();if(o(e,n))return"今天";let r=new ae(n.getTime()-864e5);return o(e,r)?"昨天":`${e.getMonth()+1}/${e.getDate()}`}let it="lv_quick_note_draft",St="lv_quick_note_draft_at",Ut="lv_quick_note_target_mode",rt="lv_lifelog_draft",Tt="lv_lifelog_draft_at";function It(t){let e=et();if(!e)return[];try{let n=e.getItem(t),o=n?JSON.parse(n):[];return Array.isArray(o)?o.map(r=>{if(typeof r=="string")return{l:r};if(r&&typeof r=="object"&&typeof r.l=="string"){let l=r;return{l:l.l,b:typeof l.b=="string"?l.b:void 0,bs:Array.isArray(l.bs)?l.bs.filter(c=>typeof c=="string"):void 0}}return null}).filter(r=>r!==null):[]}catch{return[]}}function go(t,e,n,o){let r=et(),l=[{l:e,b:n,bs:o&&o.length>0?o:void 0},...It(t)].slice(0,8);try{r?.setItem(t,JSON.stringify(l))}catch{}return l}function bo(t){let e=et(),n=It(t),o=n.shift()||null;try{e?.setItem(t,JSON.stringify(n))}catch{}return o}function bn(){return`lv_lifelog_today_${dt()}`}function yn(){return`lv_quicknote_today_${dt()}`}function ha(){return It(bn())}function ma(t,e,n){return go(bn(),t,e,n)}function yo(t,e){let n=t[0];if(!n)return'<div class="lv-qw-recent-strip" style="display:none;"></div>';let o="";if(e?.catCounts){let l=new Map;for(let c of t){let i=c.l.match(/^\d{2}:\d{2}\s+(.+?)：/);i&&i[1]&&l.set(i[1],(l.get(i[1])||0)+1)}l.size>0&&(o=` · <span class="lv-qw-cat-count">${[...l.entries()].sort((c,i)=>i[1]-c[1]).slice(0,3).map(([c,i])=>`${v(c)} ${i}`).join(" · ")}</span>`)}let r=n.b?'<button type="button" class="lv-qw-undo-btn" aria-label="撤销最近一条写入" title="从日记中删除刚写入的这条记录">↩ 撤销</button>':"";return`<div class="lv-qw-recent-strip" title="${v(t.map(l=>l.l).join(" | "))}"><span class="lv-qw-strip-text">🕒 今日已记 ${t.length} 条${o} · 最近: ${v(n.l)}</span>${r}</div>`}let xn=!1;async function xo(t,e,n){if(xn)return;let o=It(t)[0];if(!o)return;let r=Array.from(new Set([o.b,...o.bs||[]].filter(l=>!!l)));if(r.length===0){N.capsule({source:e,message:"该条记录缺少块定位，无法撤销",duration:2200,level:"warn",archive:!1});return}xn=!0;try{let l=0;for(let c of r)try{(await se("/api/block/deleteBlock",{id:c})).code!==0&&(l+=1)}catch{l+=1}l===0?(bo(t),oe(8),N.capsule({source:e,message:`↩ 已撤销：${o.l.slice(0,26)}`,duration:2400,level:"success",archive:!1})):(N.capsule({source:e,message:"撤销失败: 部分块可能已被手动删除",duration:2600,level:"warn",archive:!1}),bo(t)),n?.()}finally{xn=!1}}let hn=!1;async function mn(){if(H.getLvEcosystemToggles?.()?.activityLog&&!hn){hn=!0;try{if(ln.getTodayRecords().length===0){N.capsule({source:"罗盘",message:"今日暂无生态活动记录",duration:2400,archive:!1});return}let t=ln.formatAsMarkdown();if(!t||!t.trim()){N.capsule({source:"罗盘",message:"今日暂无生态活动记录",duration:2400,archive:!1});return}let e=!1,n="",o=dt(),r="custom-lv-activity-review-date";try{let l=await se("/api/query/sql",{stmt:`SELECT id, root_id FROM blocks WHERE ial LIKE '%${r}="${o}"%' ORDER BY updated DESC LIMIT 1`}),c=l.code===0&&Array.isArray(l.data)?l.data[0]:null;c?.id&&(await se("/api/block/updateBlock",{id:String(c.id),dataType:"markdown",data:t})).code===0&&(e=!0,n=String(c.root_id||""))}catch{}if(!e){let l=await st(t,void 0,{attrs:{[r]:o}});l.ok&&(e=!0,n=l.docId||"",l.blockId&&await se("/api/attr/setBlockAttrs",{id:l.blockId,attrs:{[r]:o}}).catch(()=>{}))}if(!e)try{let l=q.siyuanCheckin||q.LvHome;l&&typeof l.appendDailyNote=="function"&&(await l.appendDailyNote(t),e=!0)}catch{}if(e)N.capsule({source:"罗盘",message:"📝 已将今日全生态活动写入日记",duration:2800,level:"success",archive:!1,action:n?{label:"看日记",onClick:()=>{Ze(n)}}:{label:"看日记",onClick:()=>{ot()}}});else{let l=await qt(t);N.capsule({source:"罗盘",message:l?"已复制今日回顾 Markdown，可直接粘贴至日记":"今日回顾已就绪",duration:2800,archive:!1})}}finally{hn=!1}}}function ho(t){if(typeof t.onClick=="function"){try{t.onClick()}catch(e){console.warn("[LvLaunchpad] 穿透结果打开失败:",e);try{N.capsule({source:"穿透搜索",message:"结果打开异常，请重试",duration:2200,level:"warn",archive:!1})}catch{}}return}if(t.linkBlockId){Ze(t.linkBlockId);return}try{N.capsule({source:"穿透搜索",message:"该结果暂不支持直达",duration:2e3,archive:!1})}catch{}}let wn=!1;async function ot(){if(wn)return;wn=!0;let t=Qe();Se(),$e();try{let e="";try{let c=t.diaryNotebookId?.trim()||"";e=await Vt(c||void 0)||""}catch(c){console.warn("[LvLaunchpad] createDailyNote API error:",c)}let n=!!(e&&ht()?.id===e);if(e&&!n)await Ze(e);else if(!e)try{let c=new KeyboardEvent("keydown",{key:"5",code:"Digit5",altKey:!0,bubbles:!0});C.body.dispatchEvent(c),N.capsule({source:"日记",message:"未能直接定位日记文档，已尝试思源原生日记入口 (Alt+5)",duration:2400,level:"warn",archive:!1})}catch{}let o=!1,r=()=>{if(o||typeof C>"u")return!0;let i=(e?C.querySelector(`.layout__wnd--active .protyle:not(.fn__none) .protyle-wysiwyg[data-doc-id="${e}"]`)||C.querySelector(`.protyle:not(.fn__none) .protyle-wysiwyg[data-doc-id="${e}"]`):null)?.closest(".protyle")||ba()||C.querySelector(".protyle:not(.fn__none) .protyle-content, #editor .protyle-content")?.closest(".protyle");if(!i)return!1;let a=i.querySelector(".protyle-scroll__down");a&&a.click();let d=i.querySelector(".protyle-content");d&&(d.scrollTop=d.scrollHeight);try{let p=i.querySelector(".protyle-wysiwyg"),g=p?.lastElementChild,h=g?Array.from(g.querySelectorAll('[contenteditable="true"]')):[],T=(h.length?h[h.length-1]:null)||(g?.getAttribute?.("contenteditable")==="true"?g:null)||g;if(T&&typeof T.focus=="function"){T.focus();let E=q.getSelection?.();if(E){let S=C.createRange();S.selectNodeContents(T),S.collapse(!1),E.removeAllRanges(),E.addRange(S)}o=!e||p?.getAttribute("data-doc-id")===e}}catch{}return o},l=n?[40,220]:[160,420,820,1300];for(let c of l)q.setTimeout(()=>{o||r()},c);N.capsule({source:"日记",message:"⬇️ 已直达今日日记底部",duration:2200,archive:!1,action:{label:"⚡ 记一笔",onClick:()=>Xe()}})}finally{wn=!1}}async function wa(){let t=Rt.getDiagnostics(),e=i=>String(i).padStart(2,"0"),n=new ae,r=["🐴 小驴生态诊断报告","──────────────────────────────",`⏱ 生成时间：${`${n.getFullYear()}-${e(n.getMonth()+1)}-${e(n.getDate())} ${e(n.getHours())}:${e(n.getMinutes())}:${e(n.getSeconds())}`}`,`🧭 运行环境：${tt()?"移动端":"桌面端"}`];try{let i=typeof Ue<"u"?String(Ue.userAgent):"unknown";r.push(`🌐 UA：${i.length>140?`${i.slice(0,140)}…`:i}`)}catch{}let l="❌ 思源内核不可达（/api/system/version 探测失败，请确认思源已启动）";try{if(typeof gt=="function"){let i=new AbortController,a=Pe(()=>{try{i.abort()}catch{}},3e3),d=await gt("/api/system/version",{method:"POST",body:"{}",signal:i.signal});Oe(a);let p=await d.json().catch(()=>null),g=p?.data,h=typeof g=="string"?g:String(g?.version??"");p&&p.code===0?l=`✅ 正常（内核 ${h||"未知版本"}）`:l=`⚠ 内核响应异常（code=${String(p?.code??"?")}）`}}catch{}r.push(`🔗 内核连通：${l}`),r.push(`🧩 协同宿主：${t.coordinatorHost}`),r.push(`🧩 已联结插件（${t.registeredPlugins.length}）：${t.registeredPlugins.join("、")||"无"}`),r.push(`📡 今日活动：${t.todayActivitiesCount} 项`),r.push(`🤖 AI 网关：${t.hasSharedAiConfig?`已配置（${t.sharedAiModel??"未知模型"}）`:"未配置"}`),r.push(`🩺 协议版本：lv-kit v${t.version}`);try{if(We){let i=0,a=0;for(let d=0;d<We.length;d++){let p=We.key(d);p&&p.startsWith("lv_")&&(i+=(We.getItem(p)||"").length,a+=1)}r.push(`💾 本地状态：${a} 个 lv_* 键，约 ${(i/1024).toFixed(1)} KB`)}}catch{}let c=Rt.getRecentErrors();if(r.push("",`🩺 最近错误（${c.length} 条 / 环形上限 50）：`),c.length===0)r.push("  ✅ 无错误记录");else for(let i of c.slice(-10).reverse()){let a=new ae(i.ts);r.push(`  - [${e(a.getHours())}:${e(a.getMinutes())}:${e(a.getSeconds())}] [${i.source}]${i.count>1?` ×${i.count}`:""} ${i.message}`),i.stack&&r.push(`      ${i.stack.split(`
`).slice(0,2).join(`
      `)}`)}return r.push("──────────────────────────────"),r.push(`📮 反馈渠道：QQ 群 ${Je} ｜ 邮箱 ${Pt}`),r.push("请将本报告整段一起发送给开发者，即可快速定位问题。"),r.join(`
`)}function kn(t){try{let e=Array.isArray(t)?t[0]?.doOperations?.[0]:t?.doOperations?.[0];if(e&&typeof e=="object")return{blockId:typeof e.id=="string"?e.id:void 0,docId:typeof e.rootID=="string"?e.rootID:typeof e.parentID=="string"?e.parentID:void 0}}catch{}return{}}function Gt(t){try{let e=Array.isArray(t)?t[0]?.doOperations:t?.doOperations;if(Array.isArray(e)){let n=e.map(c=>c&&typeof c.id=="string"?c.id:"").filter(Boolean),o=e.find(c=>c&&typeof c.rootID=="string")?.rootID,r=e.find(c=>c&&typeof c.parentID=="string")?.parentID;return{ids:n,docId:typeof o=="string"?o:typeof r=="string"?r:void 0,blockId:n[0]}}}catch{}return{ids:[]}}function Fe(t=new ae){return Mt(t).ymd}function Ct(t,e){let n=String(t||"").trim();if(!n)return!1;let o=n.match(/^(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?:\d{6})?(?:[-_]|$)/);return o?`${o[1]}-${o[2]}-${o[3]}`===e:!0}function mt(t,e,n){let o=jt(n?.cacheScope);if(!o.docId&&!o.ymd)return;let r=Fe(n?.now);(o.ymd!==r||o.ymd===t||e&&o.docId?.docId===e)&&lo(n?.cacheScope)}function $n(t,e,n){let o=jt(n);if(!o.docId||!o.docId.docId||o.ymd!==t||o.docId.ymd!==t||!Ct(o.docId.docId,t))return null;let r=String(e||"").trim(),l=r||Yt(),c=o.notebookId||o.docId.notebookId;return l&&c&&l!==c||r&&!c?null:o.docId.docId}function ut(t,e,n,o){let r=String(t||"").trim(),l=String(e||"").trim(),c=String(n||"").trim();if(!r||!l)return!1;if(Fe(o?.now)!==l||!Ct(r,l))return mt(l,r,o),!1;let a=jt(o?.cacheScope);return a.ymd=l,a.notebookId=c,a.docId={date:l.replace(/-/g,""),ymd:l,notebookId:c,docId:r},!0}function Mt(t=new ae){let e=String(t.getFullYear()),n=String(t.getMonth()+1).padStart(2,"0"),o=String(t.getDate()).padStart(2,"0");return{yyyy:e,mm:n,dd:o,yyyymmdd:`${e}${n}${o}`,ymd:`${e}-${n}-${o}`}}function mo(t){let e=String(t||"").trim().replace(/\\+/g,"/").replace(/\/+/g,"/").replace(/\/+$/,"");if(!e)return"";let n=e.startsWith("/")?e:`/${e}`;return n==="/"?"":n}let ka=/^(?:2006|01|02|[-_./ \u4e00-\u9fff])+$/,$a=/^now\s*\|\s*date\s*(?:"([^"]*)"|'([^']*)')$/;function La(t,e){let n=String(t||"").trim();if(!n)return null;let{yyyy:o,mm:r,dd:l}=Mt(e),c=!1,i=n.replace(/\{\{([\s\S]*?)\}\}/g,(d,p)=>{let h=p.trim().match($a),T=h?h[1]??h[2]??"":"";return!h||!T||!ka.test(T)||!/(?:2006|01|02)/.test(T)||/_2/.test(T)?(c=!0,""):T.replace(/2006|01|02/g,E=>E==="2006"?o:E==="01"?r:E==="02"?l:E)});return c||i.includes("{")||i.includes("}")?null:mo(i)||null}function Yt(){let t=Qe(),e=t.lifeLogNotebookId?.trim()||t.diaryNotebookId?.trim()||t.quickNoteNotebookId?.trim();if(e)return e;try{if(typeof q<"u"){let n=q,o=n.siyuan?.storage?.["local-dailynoteid"]||n.siyuan?.config?.note?.dailyNote?.notebook||n.siyuan?.config?.general?.dailyNote?.notebook;if(o&&typeof o=="string"&&o.trim())return o.trim();let l=et()?.getItem("local-dailynoteid");if(l&&typeof l=="string"&&l.trim())return l.trim()}}catch{}return""}function Ea(t){if(!Array.isArray(t)||t.length===0)return"";let e=t.filter(r=>typeof r=="string"&&r.trim().length>0).map(r=>r.trim());if(e.length===0)return"";if(e.length===1)return e[0];let n=/^(\d{14})-[a-z0-9]+$/i,o=e.map((r,l)=>{let c=r.match(n);return{id:r,ts:c&&c[1]?c[1]:null,index:l}});return o.sort((r,l)=>{if(r.ts&&l.ts){if(r.ts!==l.ts)return r.ts<l.ts?-1:1}else{if(r.ts&&!l.ts)return-1;if(!r.ts&&l.ts)return 1}return r.index-l.index}),o[0].id}async function wo(t,e){let n=t?.trim()||"";if(n)try{let r=(await lt(!1,e)).find(l=>l.id===n);r&&/管家|人脉|题库|闪卡|拾遗|生态|空间|exam|contacts|home|checkin|glean/i.test(r.name)&&(console.warn("[LvKit HardGuard] 拦截到向插件专属笔记本创建日记的非法调用，强制纠偏至主日记本:",r.name),n="")}catch{}return n}async function ko(t,e=new ae,n){let o=String(t||"").trim();if(!o)return{status:"unknown",reason:"missing-notebook-id"};let r=n?.postFn??se,l="";try{let d=await r("/api/notebook/getNotebookConf",{notebook:o});if(!d||d.code!==0||!d.data||typeof d.data!="object")return{status:"unknown",reason:`getNotebookConf-failed(code=${String(d?.code??"unknown")})`};let p=d.data,g=p.conf?.dailyNoteSavePath??p.dailyNoteSavePath;typeof g=="string"&&g.trim()&&(l=g.trim())}catch{return{status:"unknown",reason:"getNotebookConf-error"}}if(!l)return{status:"unknown",reason:"empty-dailyNoteSavePath"};let c="",i=!1;try{let d=await r("/api/template/renderSprig",{template:l});if(d&&d.code===0&&typeof d.data=="string"){let p=d.data.trim();p.startsWith("/")&&!p.includes("{{")&&!p.includes("}}")&&(c=mo(p))}else n?.strictSprig&&d&&typeof d.code=="number"&&d.code!==0&&(i=!0)}catch{}if(i)return{status:"unknown",reason:"renderSprig-failed"};if(!c){let d=La(l,e);if(d===null)return{status:"unknown",reason:"unsupported-template"};c=d}if(!c)return{status:"unknown",reason:"unresolved-dailyNoteSavePath"};let{ymd:a}=Mt(e);try{let d=await r("/api/filetree/getIDsByHPath",{notebook:o,path:c});if(!d||d.code!==0||!Array.isArray(d.data))return{status:"unknown",reason:`getIDsByHPath-failed(code=${String(d?.code??"unknown")})`};if(d.data.length===0)return{status:"confirmed-missing",notebookId:o,ymd:a};let p=Ea(d.data);return p?{status:"found",docId:p}:{status:"unknown",reason:"invalid-hpath-data"}}catch{return{status:"unknown",reason:"getIDsByHPath-error"}}}async function vt(t,e){try{let n=e?.getNow??(()=>new ae),o=e?.date?new ae(e.date.getTime()):new ae(n().getTime()),{yyyy:r,mm:l,dd:c,yyyymmdd:i,ymd:a}=Mt(o),d=t?.trim()||"",p=e?.postFn??se,g={cacheScope:e?.cacheScope,now:n()};if(a===Fe(n())){let D=$n(a,d,e?.cacheScope);if(D)return{status:"found",docId:D}}let h="AND content NOT LIKE '%(冲突%' AND content NOT LIKE '%conflict%' AND content NOT LIKE '%(Conflicted%' AND hpath NOT LIKE '%(冲突%' AND hpath NOT LIKE '%conflict%' AND hpath NOT LIKE '%(Conflicted%'",T=`(ial LIKE '%custom-dailynote-${i}%' OR ial LIKE '%custom-dailynote-${a}%' OR ial LIKE '%custom-dailynote="${i}"%' OR ial LIKE '%custom-dailynote="${a}"%' OR hpath LIKE '%/${a}%' OR hpath LIKE '%/${i}%' OR hpath LIKE '%/${r}/${l}/${c}%' OR hpath LIKE '%/${r}/${l}/${a}%' OR hpath LIKE '%/${r}年${l}月${c}日%')`,E=!0,S="";if(d)try{let D=`SELECT id FROM blocks WHERE type='d' AND box='${d.replace(/'/g,"''")}' AND ${T} ${h} ORDER BY created ASC LIMIT 1`,f=await p("/api/query/sql",{stmt:D});if(!f||f.code!==0||!Array.isArray(f.data))E=!1,S=`sql-nb-failed(code=${String(f?.code??"unknown")})`;else if(f.data[0]?.id){let L=String(f.data[0].id).trim();if(L)return ut(L,a,d,g),{status:"found",docId:L};E=!1,S="sql-nb-empty-id"}else f.data.length>0&&(E=!1,S="sql-nb-invalid-row")}catch{E=!1,S="sql-nb-error"}if(!(e?.strictNotebook&&d))try{let D=`SELECT id, box FROM blocks WHERE type='d' AND ${T} ${h} ORDER BY created ASC LIMIT 1`,f=await p("/api/query/sql",{stmt:D});if(!f||f.code!==0||!Array.isArray(f.data))E=!1,S||(S=`sql-global-failed(code=${String(f?.code??"unknown")})`);else if(f.data[0]?.id){let L=String(f.data[0].id).trim();if(L){let y=String(f.data[0]?.box||"").trim()||d||Yt();return ut(L,a,y,g),{status:"found",docId:L}}E=!1,S||(S="sql-global-empty-id")}else f.data.length>0&&(E=!1,S||(S="sql-global-invalid-row"))}catch{E=!1,S||(S="sql-global-error")}let P=d||await Ot(p);if(!P)return{status:"unknown",reason:S||"missing-target-notebook"};let j=await ko(P,o,{postFn:p,strictSprig:e?.strictSprig});return j.status==="found"?(ut(j.docId,a,P,{cacheScope:e?.cacheScope,now:n()}),j):E?j.status==="unknown"?j:{status:"confirmed-missing",notebookId:j.notebookId,ymd:j.ymd}:{status:"unknown",reason:S||"sql-not-confirmed-empty"}}catch{return{status:"unknown",reason:"probe-exception"}}}async function qa(t,e){let n=t?.trim()||"",o=e?.getNow??(()=>new ae),r=Fe(o()),l=$n(r,n,e?.cacheScope);if(l)return l;let c=await vt(n,e);return c.status==="found"?c.docId:null}async function Vt(t,e){let n=e?.getNow??(()=>new ae),o=e?.postFn??se,r=jt(e?.cacheScope),l=Fe(n()),c=e?.skipNormalize?t?.trim()||"":await wo(t,o),i=Fe(n()),a=e?.expectedNotebookId?.trim()||"",d=e?.expectedYmd?.trim()||"";if(i!==l||d&&d!==i)return console.warn("[LvKit] 建档准备期间日期已跨午夜，拒绝盲建:",d||l,"->",i),null;let p=$n(i,c,e?.cacheScope);if(p)return p;if(!e?.skipPreLockProbe){let f=await vt(c,e);if(f.status==="found")return f.docId;if(f.status==="unknown")return console.warn("[LvKit] 今日日记探查状态未知，拒绝盲建:",f.reason),null;a||(a=f.notebookId),d||(d=f.ymd)}let h=c||a||Yt()||await Ot(o),T=new ae(n().getTime()),{ymd:E}=Mt(T);if(!h)return console.warn("[LvKit] 单飞锁前未解析到目标笔记本，拒绝盲建"),null;if(E!==i||d&&d!==E)return console.warn("[LvKit] 单飞锁前日期已跨日，拒绝向未核验日期建档:",d||i,"->",E),null;if(a&&a!==h)return console.warn("[LvKit] 单飞锁前目标笔记本已切换，拒绝向未核验目标建档:",a,"->",h),null;let S=h,P=`${E}::${S}`,j=r.flightMap.get(P);if(!j){let f=(async()=>{try{if(a&&a!==S)return console.warn("[LvKit] 单飞锁内目标笔记本已切换，拒绝向未核验目标建档:",a,"->",S),null;if(d&&d!==E)return console.warn("[LvKit] 单飞锁内日期已跨日，拒绝向未核验日期建档:",d,"->",E),null;let L=await vt(S,{...e,date:T});if(L.status==="found")return Fe(n())!==E||!Ct(L.docId,E)?(mt(E,L.docId,{cacheScope:e?.cacheScope,now:n()}),null):(ut(L.docId,E,S,{cacheScope:e?.cacheScope,now:n()}),{docId:L.docId,ymd:E,notebookId:S});if(L.status!=="confirmed-missing")return console.warn("[LvKit] 单飞锁内今日日记核验状态未知，拒绝盲建:",L.reason),null;let y=Fe(n());if(!L.notebookId||L.notebookId!==S||L.ymd!==E||L.ymd!==y)return console.warn("[LvKit] 今日日记探查绑定目标不一致或已跨日，拒绝盲建:",L,{lockYmd:E,curYmd:y}),null;if(!c&&!e?.strictNotebook){let Y=Yt();if(Y&&Y!==L.notebookId)return console.warn("[LvKit] 探测期间默认日记本设置发生漂移，拒绝向未核验目标建档:",L.notebookId,"->",Y),null}if(Fe(n())!==E)return console.warn("[LvKit] 发起 createDailyNote 前检测到已跨午夜，中止建档:",E,"->",Fe(n())),null;let A=L.notebookId,Q={app:(typeof q<"u"?q?.siyuan?.app?.id:"")||"siyuan",notebook:A},re=await o("/api/filetree/createDailyNote",Q),fe=re&&re.code===0&&re.data?.id?String(re.data.id).trim():"";if(fe)return Ct(fe,E)?(ut(fe,E,A,{cacheScope:e?.cacheScope,now:n()}),{docId:fe,ymd:E,notebookId:A}):(mt(E,fe,{cacheScope:e?.cacheScope,now:n()}),null);if(Fe(n())!==E)return mt(E,void 0,{cacheScope:e?.cacheScope,now:n()}),null;let ne=await vt(A,{...e,date:T});if(ne.status==="found"&&Fe(n())===E&&Ct(ne.docId,E))return ut(ne.docId,E,A,{cacheScope:e?.cacheScope,now:n()}),{docId:ne.docId,ymd:E,notebookId:A}}catch(L){console.warn("[LvKit] createDailyNote 异常:",L)}return null})().finally(()=>{r.flightMap.get(P)===f&&r.flightMap.delete(P)});r.flightMap.set(P,f),j=f}let D=await j;return!D||!D.docId?null:Fe(n())!==D.ymd?(mt(D.ymd,D.docId,{cacheScope:e?.cacheScope,now:n()}),D.ymd===i?D.docId:null):(ut(D.docId,D.ymd,D.notebookId,{cacheScope:e?.cacheScope,now:n()}),D.docId)}let wt="custom-lv-diary-zone",nl="#### 🐴 小驴记录",$o="🐴 小驴记录",ol="lv_diary_zone_config_v1",Qt=new Map;function Sa(t,e){let n=String(t||"__default__"),o=Qt.get(n)||Promise.resolve(),r,l=new Promise(i=>{r=i}),c=o.catch(()=>{}).then(()=>l);return Qt.set(n,c),o.catch(()=>{}).then(async()=>{try{return await e()}finally{r(),Qt.get(n)===c&&Qt.delete(n)}})}function Lo(t,e=4){let o=String(t?.subType||t?.subtype||"").trim().toLowerCase().match(/^h([1-6])$/);if(o&&o[1])return Number(o[1]);let l=String(t?.markdown||t?.content||"").trim().match(/^(#{1,6})\s+/);return l&&l[1]?l[1].length:e}function Ta(t){return String(t||"").replace(/\{:[^}]*\}\s*$/g,"").replace(/<[^>]+>/g,"").replace(/^#{1,6}\s+/,"").replace(/\u200b/g,"").replace(/\s+/g," ").trim()}async function Ln(t,e){if(!t||typeof t!="string"||!t.trim())throw new Error("[DIARY-ZONE-INVALID-DOC] docId is required");let n=t.trim(),o=e?.postFn||se,r=no(),l=e?.headingLevel===3?3:e?.headingLevel===4?4:r.headingLevel,c=e?.defaultFolded!==void 0?!!e.defaultFolded:r.defaultFolded;return Sa(n,async()=>{let i=[];try{let P=await o("/api/block/getChildBlocks",{id:n});P?.code===0&&Array.isArray(P.data)&&(i=P.data.filter(j=>j&&typeof j.id=="string"&&j.id.trim().length>0))}catch{i=[]}let a=null,d=!1;for(let P of i){if(io(P.ial)[wt]==="1"){a=P;break}if(P.type==="h"||/^h[1-6]$/i.test(String(P.subType||P.subtype||"")))try{let D=await o("/api/attr/getBlockAttrs",{id:P.id});if(D?.code===0&&D.data?.[wt]==="1"){a=P;break}}catch{}}if(!a)for(let P of i){if(!(P.type==="h"||/^h[1-6]$/i.test(String(P.subType||P.subtype||""))))continue;let D=Ta(P.content||P.markdown||"");if(D===$o||D==="小驴记录"){a=P,d=!0;break}}if(!a)try{let P=Ft(n),j=await o("/api/query/sql",{stmt:`SELECT b.id, b.type, b.subtype, b.content FROM attributes a JOIN blocks b ON a.block_id=b.id WHERE b.root_id='${P}' AND a.name='${wt}' AND a.value='1' ORDER BY b.sort ASC LIMIT 5`});if(j?.code===0&&Array.isArray(j.data))for(let D of j.data){let f=String(D.id||"");if(!f)continue;let L=await o("/api/block/getBlockDOM",{id:f}).catch(()=>null);if(!L||L.code===0&&L.data?.id===f){a={id:f,type:D.type?String(D.type):"h",subtype:D.subtype?String(D.subtype):`h${l}`,content:D.content?String(D.content):""};break}}if(!a){let D=await o("/api/query/sql",{stmt:`SELECT id, type, subtype, content FROM blocks WHERE root_id='${P}' AND type='h' AND content LIKE '%🐴 小驴记录%' ORDER BY sort ASC LIMIT 5`});if(D?.code===0&&Array.isArray(D.data))for(let f of D.data){let L=String(f.id||"");if(!L)continue;let y=await o("/api/block/getBlockDOM",{id:L}).catch(()=>null);if(!y||y.code===0&&y.data?.id===L){a={id:L,type:"h",subtype:f.subtype?String(f.subtype):`h${l}`,content:f.content?String(f.content):""},d=!0;break}}}}catch{}if(a){if(d){let y=await o("/api/attr/setBlockAttrs",{id:a.id,attrs:{[wt]:"1"}});if(y&&typeof y.code=="number"&&y.code!==0)throw new Error(`[DIARY-ZONE-API] setBlockAttrs failed on ${a.id}: ${y.msg||y.code}`)}let P=!1;try{P=(await o("/api/attr/getBlockAttrs",{id:a.id}))?.data?.fold==="1"}catch{P=!1}let j=Lo(a,l),D=j===3?3:4,f=a.id,L=i.findIndex(y=>y.id===a.id);if(L>=0){let y=null;for(let A=L+1;A<i.length;A++){let Q=i[A];if(Q&&(Q.type==="h"||/^h[1-6]$/i.test(String(Q.subType||Q.subtype||"")))&&Lo(Q,6)<=j)break;Q?.id&&(y=Q.id)}y&&(f=y)}return{ok:!0,docId:n,zoneHeadingId:a.id,anchorBlockId:f,insertPosition:"after",created:!1,folded:P,headingLevel:D}}let g=`${"#".repeat(l)} ${$o}
{: ${wt}="1" }`,h=await o("/api/block/appendBlock",{parentID:n,dataType:"markdown",data:g});if(!h||h.code!==0)throw new Error(`[DIARY-ZONE-CREATE-FAILED] appendBlock failed on ${n}: ${h?.msg||h?.code||"unknown"}`);let T=kn(h.data).blockId;if(!T)throw new Error(`[DIARY-ZONE-CREATE-FAILED] appendBlock returned no zoneHeadingId for ${n}`);let E={[wt]:"1"};c&&(E.fold="1");let S=await o("/api/attr/setBlockAttrs",{id:T,attrs:E});if(S&&typeof S.code=="number"&&S.code!==0)throw new Error(`[DIARY-ZONE-API] setBlockAttrs failed on ${T}: ${S.msg||S.code}`);return{ok:!0,docId:n,zoneHeadingId:T,anchorBlockId:T,insertPosition:"after",created:!0,folded:c,headingLevel:l}})}async function st(t,e,n){let o=await wo(e),r=async a=>{if(n?.useDiaryZone!==!1){let p=await Ln(a),g=await se("/api/block/insertBlock",{previousID:p.anchorBlockId,parentID:a,dataType:"markdown",data:t});if(g.code===0){let h=Gt(g.data);if(h.blockId&&n?.attrs&&Object.keys(n.attrs).length>0){let T=await se("/api/attr/setBlockAttrs",{id:h.blockId,attrs:n.attrs});if(T&&typeof T.code=="number"&&T.code!==0)return{ok:!1,msg:T.msg||"写入块属性失败",docId:a,zoneHeadingId:p.zoneHeadingId}}return{ok:!0,docId:h.docId||a,blockId:h.blockId,ids:h.ids,zoneHeadingId:p.zoneHeadingId}}return{ok:!1,msg:g.msg||"插入日记分区块失败",docId:a,zoneHeadingId:p.zoneHeadingId}}let d=await se("/api/block/appendBlock",{data:t,dataType:"markdown",parentID:a});if(d.code===0){let p=Gt(d.data);return p.blockId&&n?.attrs&&Object.keys(n.attrs).length>0&&await se("/api/attr/setBlockAttrs",{id:p.blockId,attrs:n.attrs}),{ok:!0,docId:p.docId||a,blockId:p.blockId,ids:p.ids}}return{ok:!1,msg:d.msg||"追加块失败"}},l=await vt(o),c=l.status==="found"?l.docId:null,i=l.status==="confirmed-missing"?{notebookId:l.notebookId,ymd:l.ymd}:null;if(c){try{let d=await r(c);if(d.ok)return d}catch{}lo();let a=await vt(o);if(a.status==="found")c=a.docId;else{if(a.status==="unknown")return{ok:!1,msg:`无法确认今日日记状态（${a.reason}），已中止自动创建以防重复`};c=null,i={notebookId:a.notebookId,ymd:a.ymd}}}else if(l.status==="unknown")return{ok:!1,msg:`无法确认今日日记状态（${l.reason}），已中止自动创建以防重复`};return c||(c=await Vt(o,{skipPreLockProbe:!0,expectedNotebookId:i?.notebookId,expectedYmd:i?.ymd})),c?await r(c):{ok:!1,msg:"无法定位或创建今日日记文档"}}async function Ia(t,e){let n=ao(t),o=pa(t),r=ua({...t,eventId:n["custom-lv-event-id"],date:n["custom-lv-date"]}),l=e?.postFn||se;if(t.eventId)try{let i=t.docId?`b.root_id='${Ft(t.docId)}' AND `:"",a=await l("/api/query/sql",{stmt:`SELECT b.id, b.root_id FROM attributes a JOIN blocks b ON a.block_id=b.id WHERE ${i}a.name='custom-lv-event-id' AND a.value='${Ft(t.eventId)}' LIMIT 3`});if(a?.code===0&&Array.isArray(a.data))for(let d of a.data){let p=String(d.id||"");if(!p)continue;let g=await l("/api/block/getBlockDOM",{id:p}).catch(()=>null);if(!g||g.code===0&&g.data?.id===p)return{ok:!0,docId:d.root_id?String(d.root_id):t.docId,blockId:p,attrs:n,text:o,deduplicated:!0}}}catch{}if(t.docId?.trim()){let i=t.docId.trim(),a,d;if(t.useDiaryZone!==!1){let p=await Ln(i,{postFn:e?.postFn});a=p.zoneHeadingId,d=await l("/api/block/insertBlock",{previousID:p.anchorBlockId,parentID:i,dataType:"markdown",data:r})}else d=await l("/api/block/appendBlock",{parentID:i,dataType:"markdown",data:r});if(d?.code===0){let p=Gt(d.data);if(p.blockId){let g=await l("/api/attr/setBlockAttrs",{id:p.blockId,attrs:n});if(g&&typeof g.code=="number"&&g.code!==0)return{ok:!1,docId:i,zoneHeadingId:a,attrs:n,text:o,msg:g.msg||"写入块属性失败"}}return{ok:!0,docId:p.docId||i,blockId:p.blockId,ids:p.ids,zoneHeadingId:a,attrs:n,text:o}}return{ok:!1,docId:i,zoneHeadingId:a,attrs:n,text:o,msg:d?.msg||"写入 LifeLog 失败"}}return{...await st(r,t.notebook,{useDiaryZone:t.useDiaryZone,attrs:n}),attrs:n,text:o}}async function Ca(t){let e=t?.postFn||se,n=Math.max(1,Math.min(2e3,Number(t?.limit||100))),o=["(a.name = 'custom-lv-lifelog' OR a.name = 'custom-lifelog-type' OR (a.name = 'custom-lv-type' AND a.value = 'event-log'))"];t?.docId&&o.push(`b.root_id = '${Ft(t.docId)}'`);let r=`SELECT DISTINCT b.id, b.root_id, b.content, b.markdown, b.ial, b.created, b.updated
FROM attributes a
JOIN blocks b ON a.block_id = b.id
WHERE ${o.join(" AND ")}
ORDER BY b.created DESC, b.id DESC
LIMIT ${Math.min(2e3,n*4)}`,l=await e("/api/query/sql",{stmt:r});if(l?.code!==0||!Array.isArray(l.data))return[];let c=t?.date?String(t.date).replace(/\D/g,"").slice(0,8):"",i=c.length===8?`${c.slice(0,4)}-${c.slice(4,6)}-${c.slice(6,8)}`:t?.date||"",a=new Set,d=[];for(let p of l.data){let g=String(p.id||"");if(!g||a.has(g))continue;a.add(g);let h=io(p.ial);if(Object.keys(h).length===0)try{let E=await e("/api/attr/getBlockAttrs",{id:g});E?.code===0&&E.data&&(h=E.data)}catch{}let T=da({id:g,root_id:p.root_id?String(p.root_id):void 0,content:p.content?String(p.content):void 0,markdown:p.markdown?String(p.markdown):void 0,ial:p.ial?String(p.ial):void 0,created:p.created?String(p.created):void 0,updated:p.updated?String(p.updated):void 0,attrs:h});if(T&&!(i&&(T.date||"").replace(/\D/g,"").slice(0,8)!==c&&T.date!==i)&&!(t?.source&&T.source!==t.source)&&!(t?.module&&T.module!==t.module)&&!(t?.type&&T.type!==t.type)&&!(t?.target&&T.target!==t.target)&&(d.push(T),d.length>=n))break}return d}async function Ma(t,e){let n={v:1,ecosystem:"xiaolv",exportedAt:new ae().toISOString(),plugins:{},expectedPlugins:Array.from(t.keys()),failed:[],partial:!1};return await Promise.all(Array.from(t.entries()).map(async([o,r])=>{let l;try{let c=await Promise.race([Promise.resolve().then(()=>r.backup()),new Promise((i,a)=>{l=Pe(()=>a(new Error("backup-timeout")),e?.timeoutMs??1e4)})]);n.plugins[o]={plugin:o,version:"latest",exportedAt:new ae().toISOString(),data:c}}catch{n.failed.push(o),n.partial=!0}finally{l!==void 0&&Oe(l)}})),n}async function Aa(t,e){if(!e||e.v!==1||e.ecosystem!=="xiaolv"||!e.plugins||typeof e.plugins!="object"||Array.isArray(e.plugins))throw new Error("[LvBackup] 非合法的小驴全生态灾备包格式");let n=[],o=Array.isArray(e.failed)?[...e.failed]:[];for(let r of e.expectedPlugins??[])!Object.prototype.hasOwnProperty.call(e.plugins,r)&&!o.includes(r)&&o.push(r);for(let[r,l]of Object.entries(e.plugins)){if(!l||l.plugin!==r||!l.data||typeof l.data!="object"||Array.isArray(l.data)){o.push(`${r}(备份数据格式无效)`);continue}let c=t.get(r);if(!c){o.push(`${r}(未安装或未注册恢复切面)`);continue}try{await c.restore(l.data)?n.push(r):o.push(r)}catch{o.push(r)}}return{success:n,failed:o}}function En(t,e){if(t===e)return 1;let n=t.length,o=e.length;if(n===0||o===0)return 0;let r=new Set;for(let c=0;c<n-1;c++)r.add(t.slice(c,c+2));let l=0;for(let c=0;c<o-1;c++)r.has(e.slice(c,c+2))&&l++;return 2*l/(Math.max(1,n-1)+Math.max(1,o-1))}function Eo(t,e){let n=t.match(/[\u4e00-\u9fa5]|[\w]+|[^\s\w\u4e00-\u9fa5]|\s+/g)||[t],o=e.match(/[\u4e00-\u9fa5]|[\w]+|[^\s\w\u4e00-\u9fa5]|\s+/g)||[e],r=160,l=n.slice(0,r),c=o.slice(0,r),i=Array.from({length:l.length+1},()=>new Array(c.length+1).fill(0));for(let E=1;E<=l.length;E++){let S=i[E],P=i[E-1],j=l[E-1]||"";for(let D=1;D<=c.length;D++){let f=c[D-1]||"";j===f?S[D]=(P[D-1]||0)+1:S[D]=Math.max(P[D]||0,S[D-1]||0)}}let a=l.length,d=c.length,p=[],g=[];for(;a>0||d>0;){let E=l[a-1]||"",S=c[d-1]||"",P=i[a],j=i[a-1];a>0&&d>0&&E===S?(p.push(v(E)),g.push(v(S)),a--,d--):d>0&&(a===0||(P?.[d-1]??0)>=(j?.[d]??0))?(g.push(`<ins style="background:rgba(16,185,129,0.22);color:#059669;text-decoration:none;border-radius:2px;padding:0 2px;font-weight:600;">${v(S)}</ins>`),d--):a>0&&(d===0||(P?.[d-1]??0)<(j?.[d]??0))&&(p.push(`<del style="background:rgba(239,68,68,0.2);color:#ef4444;text-decoration:none;border-radius:2px;padding:0 2px;font-weight:600;">${v(E)}</del>`),a--)}let h=p.reverse().join("").replace(/<\/del><del[^>]*>/g,""),T=g.reverse().join("").replace(/<\/ins><ins[^>]*>/g,"");return{htmlA:h,htmlB:T}}function qn(t,e){let n=t.length,o=e.length,r=t.map(D=>D.content.replace(/\s+/g," ").trim()),l=e.map(D=>D.content.replace(/\s+/g," ").trim()),c=Array.from({length:n+1},()=>new Array(o+1).fill(0));for(let D=1;D<=n;D++){let f=c[D],L=c[D-1],y=r[D-1]||"";for(let A=1;A<=o;A++){let Q=l[A-1]||"";y===Q||En(y,Q)>=.4?f[A]=(L[A-1]||0)+1:f[A]=Math.max(L[A]||0,f[A-1]||0)}}let i=n,a=o,d=[],p=0,g=0,h=0,T=0,E=0;for(;i>0||a>0;){let D=t[i-1],f=e[a-1],L=r[i-1]||"",y=l[a-1]||"",A=c[i],Q=c[i-1];if(i>0&&a>0&&D&&f&&L===y)d.push({type:"identical",blockA:D,blockB:f}),p++,i--,a--;else if(i>0&&a>0&&D&&f&&En(L,y)>=.4){let re=Eo(D.content,f.content);d.push({type:"diff",blockA:{id:D.id,content:D.content,type:D.type,diffHtml:re.htmlA},blockB:{id:f.id,content:f.content,type:f.type,diffHtml:re.htmlB}}),i--,a--}else a>0&&(i===0||(A?.[a-1]??0)>=(Q?.[a]??0))?(f&&(d.push({type:"unique_b",blockB:f}),h++,E+=f.content.length),a--):i>0&&(a===0||(A?.[a-1]??0)<(Q?.[a]??0))&&(D&&(d.push({type:"unique_a",blockA:D}),g++,T+=D.content.length),i--)}let S=d.reverse(),P=n+o,j=P>0?Math.min(100,Math.round(p*2/P*100)):100;return{totalBlocksA:n,totalBlocksB:o,identicalCount:p,uniqueCountA:g,uniqueCountB:h,uniqueWordsA:T,uniqueWordsB:E,similarityPercent:j,rows:S}}async function Da(t,e,n=!1){if(e?.aborted)return"";if(!n)try{let o=typeof q<"u"?q.__LV_AI_HUB__:null;if(o&&typeof o.runTask=="function"){let r=await o.runTask({requestId:`nk-${ae.now()}`,generationNonce:1,sourcePlugin:"lv-notice-kit",capability:"L3",taskType:"summary",promptId:"notice-advisor",promptVersion:1,context:{focusBlockContent:t},piiPolicy:"standard",allowFreePool:!1,signal:e||new AbortController().signal}),l=Array.isArray(r?.blocks)?r.blocks.find(c=>c.type==="markdown"):null;if(l?.text)return String(l.text).trim()}}catch{}if(e?.aborted||typeof gt!="function")return"";try{let o=await gt("/api/ai/editor/chat",{method:"POST",headers:{"Content-Type":"application/json",Accept:"text/event-stream"},body:JSON.stringify({taskID:`lv-nk-${ae.now()}`,ids:[],history:[],input:t,action:"chat"}),signal:e});if(e?.aborted)return"";if(o.status===404||o.status===405){let c=await se("/api/ai/chat",{prompt:t});return c.code===0&&typeof c.data=="string"?c.data.trim():c.code===0&&c.data?.content?String(c.data.content).trim():""}if(!o.ok)return"";if((o.headers?.get?.("Content-Type")||"").includes("text/event-stream")&&o.body&&typeof o.body.getReader=="function"){let c=o.body.getReader(),i=new TextDecoder("utf-8"),a="",d="",p="";for(;;){let{done:g,value:h}=await c.read();if(g)break;a+=i.decode(h,{stream:!0});let T=a.split(/\r?\n/);a=T.pop()||"";for(let E of T){let S=E.trim();if(S.startsWith("event:"))d=S.slice(6).trim();else if(S.startsWith("data:"))try{let P=JSON.parse(S.slice(5).trim());(!d||d==="content")&&P?.token&&(p+=String(P.token))}catch{}}}return p.trim()}let l=typeof o.text=="function"?await o.text():"";if(!l)return"";try{let c=JSON.parse(l);if(c?.code===0&&typeof c.data=="string")return c.data.trim();if(c?.code===0&&c.data?.content)return String(c.data.content).trim()}catch{}return l.trim()}catch{return""}}let ke={async scanConflictDocs(){try{let e=await se("/api/query/sql",{stmt:"SELECT id, root_id, box, hpath, content, updated, length FROM blocks WHERE type='d' AND (content LIKE '%(冲突%' OR content LIKE '%_conflict_%' OR content LIKE '%conflict%') ORDER BY updated DESC LIMIT 50"});if(e.code===0&&Array.isArray(e.data)){let n=[];for(let o of e.data){let r=String(o.id||o.root_id),l=String(o.box||""),c=String(o.hpath||""),i=String(o.content||""),a=String(o.updated||""),d=Number(o.length)||0,p=i.replace(/\s*[\(_（](?:冲突|conflict)[^\)）]*[\)）]/gi,"").replace(/_conflict_\w+/gi,"").replace(/_conflict/gi,"").trim(),g,h,T,E,S;if(p&&p!==i)try{let j=`SELECT id, box, hpath, content, updated, length FROM blocks WHERE type='d' AND content='${p.replace(/'/g,"''")}' AND id != '${r.replace(/'/g,"''")}' LIMIT 1`,D=await se("/api/query/sql",{stmt:j});if(D.code===0&&Array.isArray(D.data)&&D.data[0]?.id){let f=D.data[0];g=String(f.id),h=String(f.content||p),T=String(f.hpath||""),E=Number(f.length)||0,S=String(f.updated||"")}}catch{}let P=0;try{let j=`SELECT count(1) as cnt FROM blocks WHERE parent_id='${r.replace(/'/g,"''")}' AND type='d' LIMIT 1`,D=await se("/api/query/sql",{stmt:j});D.code===0&&Array.isArray(D.data)&&D.data[0]?.cnt&&(P=Number(D.data[0].cnt)||0)}catch{}n.push({id:r,box:l,hpath:c,title:i,updated:a,length:d,childCount:P,baseDocId:g,baseDocTitle:h,baseDocHPath:T,baseDocLength:E,baseDocUpdated:S})}return n}}catch{}return[]},async scanDuplicateDocTitles(t=40){try{let n=`
                SELECT content as title, count(1) as cnt, group_concat(id, '|||') as ids, group_concat(box, '|||') as boxes, group_concat(hpath, '|||') as paths, group_concat(updated, '|||') as updateds, group_concat(length, '|||') as lengths
                FROM blocks
                WHERE type='d' AND content != ''
                GROUP BY content
                HAVING count(1) > 1
                ORDER BY cnt DESC, max(updated) DESC
                LIMIT ${Math.min(200,Math.max(1,Math.trunc(Number(t)||40)))}
            `,o=await se("/api/query/sql",{stmt:n});if(o.code===0&&Array.isArray(o.data)){let r=[];for(let c of o.data){let i=String(c.ids||"").split("|||").filter(Boolean);r.push(...i)}let l=new Map;if(r.length>0)try{let i=`SELECT parent_id, count(1) as cnt FROM blocks WHERE parent_id IN (${r.slice(0,300).map(d=>`'${d.replace(/'/g,"''")}'`).join(",")}) AND type='d' GROUP BY parent_id`,a=await se("/api/query/sql",{stmt:i});if(a.code===0&&Array.isArray(a.data))for(let d of a.data)d&&d.parent_id&&l.set(String(d.parent_id),Number(d.cnt)||0)}catch{}return o.data.map(c=>{let i=String(c.title),a=String(c.ids||"").split("|||"),d=String(c.boxes||"").split("|||"),p=String(c.paths||"").split("|||"),g=String(c.updateds||"").split("|||"),h=String(c.lengths||"").split("|||").map(A=>Number(A)||0),T=a.map((A,Q)=>({id:A,box:d[Q]||"",hpath:p[Q]||"",updated:g[Q]||"",length:h[Q]||0,childCount:l.get(A)||0}));T.sort((A,Q)=>(Q.childCount||0)-(A.childCount||0)||Q.length-A.length||Q.updated.localeCompare(A.updated));let E=T[0]?.id||"",S=Go(i),P=Wo(i),j=T.some(A=>A.length===0&&(A.childCount||0)===0),D=!1,f,L=!1;if(new Set(T.map(A=>A.hpath.split("/").slice(0,-1).join("/"))).size>1){let A=Math.min(...T.map(re=>re.length));(Math.max(...T.map(re=>re.length))-A>80||A===0)&&(D=!0,f="位于不同分类路径且内容体量不同，属于独立文档")}else!S&&T.length>1&&(L=!0);return{title:i,count:Number(c.cnt),docs:T,recommendedKeepId:E,isBenign:S,isContentDivergent:D,divergenceReason:f,isIgnored:P,hasEmptyShell:j,isSuspectedFork:L}})}}catch{}return[]},async getDocPreviewSnippet(t,e=140){if(!t)return"";try{let n=`SELECT content FROM blocks WHERE root_id = '${t.replace(/'/g,"''")}' AND (type='p' OR type='h' OR type='i') AND content != '' ORDER BY sort ASC LIMIT 2`,o=await se("/api/query/sql",{stmt:n});if(o.code===0&&Array.isArray(o.data)&&o.data.length>0){let r=o.data.map(l=>String(l.content||"").replace(/[\r\n\t\s]+/g," ").trim()).filter(Boolean).join(" ");return r.length>e?r.slice(0,e)+"…":r}}catch{}return""},async getDocContentBlocks(t,e=200){if(!t)return[];try{let n=`SELECT id, content, type FROM blocks WHERE root_id = '${t.replace(/'/g,"''")}' AND type IN ('p', 'h', 'b', 'i', 'c', 't', 'm', 'q') AND content != '' ORDER BY sort ASC LIMIT ${e}`,o=await se("/api/query/sql",{stmt:n});if(o.code===0&&Array.isArray(o.data))return o.data.map(r=>({id:String(r.id),content:String(r.content||"").replace(/[\r\n\t]+/g," ").trim(),type:String(r.type||"p")})).filter(r=>r.content.length>0)}catch{}return[]},computeBlockDiff(t,e){return qn(t,e)},async scanDocDuplicateBlocks(t,e=6){if(!t)return[];try{let n=Math.min(1e4,Math.max(1,Math.trunc(Number(e)||6))),o=`
                SELECT content, type, count(1) as cnt, group_concat(id, '|||') as ids
                FROM blocks
                WHERE root_id = '${t.replace(/'/g,"''")}' AND type IN ('p', 'h', 'b', 'i', 'c') AND length(content) >= ${n}
                GROUP BY content
                HAVING count(1) > 1
                ORDER BY cnt DESC
                LIMIT 40
            `,r=await se("/api/query/sql",{stmt:o});if(r.code===0&&Array.isArray(r.data))return r.data.map(l=>({content:String(l.content),type:String(l.type||"p"),count:Number(l.cnt),blockIds:String(l.ids||"").split("|||").filter(Boolean)}))}catch{}return[]},async deduplicateDocBlocks(t,e=6,n){let o=0,r=0;try{if(Array.isArray(n)&&n.length>1){let c=n.slice(1);for(let i of c)(await se("/api/block/deleteBlock",{id:i})).code===0&&o++;return{removedCount:o,cleanGroups:1}}let l=await this.scanDocDuplicateBlocks(t,e);for(let c of l)if(c.blockIds.length>1){r++;let i=c.blockIds.slice(1);for(let a of i)(await se("/api/block/deleteBlock",{id:a})).code===0&&o++}}catch{}return{removedCount:o,cleanGroups:r}},async safeRemoveDocToRecycle(t,e){if(!t)return!1;try{let n=await se("/api/block/getBlockInfo",{id:t});if(n?.code!==0||!n?.data)return!1;let o=n.data.box||e,r=n.data.path||`/${t}.sy`;return!o||!r?!1:(await se("/api/filetree/removeDoc",{notebook:o,path:r}))?.code===0?!0:(await se("/api/filetree/removeDocByID",{id:t,notebook:o}))?.code===0}catch{return!1}},async deduplicateDailyLifeLogs(t,e=!1){let n=0,o=0,r=[];try{let l=(t||(()=>{let d=new ae;return`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`})()).replace(/\D/g,"").slice(0,8);if(!l)return{removedCount:0,duplicateGroups:0,details:[]};let c=`${l.slice(0,4)}-${l.slice(4,6)}-${l.slice(6,8)}`,i=`
                SELECT DISTINCT b.id, b.root_id, b.content, b.created
                FROM attributes a
                JOIN blocks b ON a.block_id = b.id
                WHERE (a.name = 'custom-lifelog-type' OR a.name = 'custom-lv-lifelog')
                  AND (b.created LIKE '${l}%' OR a.value LIKE '%${l}%' OR b.ial LIKE '%${c}%' OR b.ial LIKE '%${l}%')
                ORDER BY b.created ASC
                LIMIT 2000
            `,a=await se("/api/query/sql",{stmt:i});if(a.code===0&&Array.isArray(a.data)){let d=new Map;for(let p of a.data){let g=(p.content||"").replace(/[\r\n\t\s]+/g," ").trim();if(!g)continue;let h=`${p.root_id}:::${g}`,T=d.get(h)||[];T.push({id:String(p.id),content:g}),d.set(h,T)}for(let[p,g]of d.entries())if(g.length>1){o++;let h=g[0]?.content.slice(0,24)||"记事";if(r.push(`「${h}…」重复 ${g.length} 次`),!e){let T=g.slice(1);for(let E of T)(await se("/api/block/deleteBlock",{id:E.id})).code===0&&n++}}}}catch{}return{removedCount:n,duplicateGroups:o,details:r}},async findDuplicateClips(){try{let e=await se("/api/query/sql",{stmt:`
                SELECT a.value as url, count(1) as cnt, group_concat(b.id, '|||') as doc_ids, group_concat(b.content, '|||') as titles, group_concat(b.box, '|||') as boxes, group_concat(b.hpath, '|||') as paths, group_concat(b.updated, '|||') as updateds
                FROM attributes a
                JOIN blocks b ON a.block_id = b.id
                WHERE a.name = 'custom-clip-url' AND a.value != ''
                GROUP BY a.value
                HAVING count(1) > 1
                LIMIT 50
            `});if(e.code===0&&Array.isArray(e.data))return e.data.map(n=>{let o=String(n.doc_ids||"").split("|||"),r=String(n.titles||"").split("|||"),l=String(n.boxes||"").split("|||"),c=String(n.paths||"").split("|||"),i=String(n.updateds||"").split("|||"),a=o.map((d,p)=>({id:d,title:r[p]||"未命名文档",box:l[p]||"",hpath:c[p]||"",updated:i[p]||""}));return{url:String(n.url),count:Number(n.cnt),docIds:o.filter(Boolean),docs:a}})}catch{}return[]},async scanOrphanDailyNotes(){let t=[];try{let e=await Ot(),n=await lt(),o=new Map(n.map(i=>[i.id,i.name])),l=`
	                SELECT id, box, hpath, ial, updated, length
	                FROM blocks
	                WHERE type='d' 
	                  AND (ial LIKE '%custom-dailynote-%' OR hpath LIKE '%/daily note/%')
	                  ${e?`AND box != '${e.replace(/'/g,"''")}'`:""}
	                ORDER BY updated DESC
	                LIMIT 100
	            `,c=await se("/api/query/sql",{stmt:l});if(c.code===0&&Array.isArray(c.data))for(let i of c.data){let a=String(i.box||"");if(a&&e&&a===e)continue;let d=typeof i.ial=="string"?i.ial:i.ial&&typeof i.ial=="object"?JSON.stringify(i.ial):String(i.ial||""),p=String(i.hpath||""),g=String(i.id||""),h="",T=d.match(/custom-dailynote-(\d{8})/);if(T&&T[1]){let y=T[1];h=`${y.slice(0,4)}-${y.slice(4,6)}-${y.slice(6,8)}`}else{let y=p.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);y&&y[1]&&(h=y[1].replace(/\//g,"-"))}if(!h)continue;let E=h.replace(/-/g,""),S,P;if(e)try{let y=await se("/api/query/sql",{stmt:`SELECT id, length FROM blocks WHERE type='d' AND box='${e.replace(/'/g,"''")}' AND (ial LIKE '%custom-dailynote-${E}%' OR hpath LIKE '%${h}%') LIMIT 1`});y.code===0&&Array.isArray(y.data)&&y.data[0]?.id&&(S=String(y.data[0].id),P=Number(y.data[0].length)||0)}catch{}let j=await this.getDocPreviewSnippet(g,120),D=Number(i.length)||0,f=D===0||!j.trim(),L=0;try{let y=await se("/api/query/sql",{stmt:`SELECT count(1) as cnt FROM blocks WHERE root_id='${g.replace(/'/g,"''")}' AND type IN ('p','h','i','b','c') AND length(content) > 0 LIMIT 1`});y.code===0&&Array.isArray(y.data)&&y.data[0]?.cnt&&(L=Number(y.data[0].cnt)||0)}catch{}t.push({id:g,box:a,boxName:o.get(a)||"未知笔记本",hpath:p,date:h,length:D,updated:String(i.updated||""),mainDocId:S,mainDocBox:e,mainDocLength:P,snippet:j||"(空日记文档，无实质流水)",isEmpty:f,pendingBlocksCount:L})}}catch{}return t},async mergeOrphanDailyNote(t){if(!t)return{ok:!1,mergedCount:0,msg:"孤立文档 ID 为空"};try{let n=(await this.scanOrphanDailyNotes()).find(h=>h.id===t);if(!n)return{ok:!1,mergedCount:0,msg:"未找到该孤立日记记录"};if(n.isEmpty||(n.pendingBlocksCount||0)===0)return await this.safeRemoveDocToRecycle(t,n.box)?(await this.cleanEmptyParentDocTree(t,n.hpath,n.box),{ok:!0,mergedCount:0,msg:"已安全清理空日记占位文档"}):{ok:!1,mergedCount:0,msg:"清理空文档失败"};let o=n.mainDocId,r=n.mainDocBox||await Ot();if(!o&&r){let h=Fe();if(n.date===h){let T=await Vt(r,{strictNotebook:!0,expectedNotebookId:r,expectedYmd:h});T&&(o=T)}else return{ok:!1,mergedCount:0,msg:`未找到 ${n.date} 对应的主日记文档，为避免跨日错并，暂停合并以保数据绝对安全`}}if(!o)return{ok:!1,mergedCount:0,msg:"无法定位或创建主日记文档，暂停合并以保数据绝对安全"};let l=await se("/api/query/sql",{stmt:`SELECT id, type, content FROM blocks WHERE root_id='${t.replace(/'/g,"''")}' AND type IN ('p','h','i','b','c') AND length(content) > 0 ORDER BY sort ASC LIMIT 2000`}),c=l.code===0&&Array.isArray(l.data)?l.data:[],i=await se("/api/query/sql",{stmt:`SELECT content FROM blocks WHERE root_id='${o.replace(/'/g,"''")}' AND type IN ('p','h','i','b','c') LIMIT 2000`}),a=new Set;if(i.code===0&&Array.isArray(i.data))for(let h of i.data){let T=(h.content||"").replace(/[\r\n\t\s]+/g," ").trim();T&&a.add(T)}let d=[];for(let h of c){let T=(h.content||"").replace(/[\r\n\t\s]+/g," ").trim();T&&(a.has(T)||d.push(String(h.content)))}let p=0;if(d.length>0){let h=d.join(`

`),T=await Fn(o,async()=>await se("/api/block/appendBlock",{parentID:o,data:h,dataType:"markdown"}));if(T.code!==0)return{ok:!1,mergedCount:0,msg:`追加到主日记失败: ${T.msg||"未知错误"}`};p=d.length}return await this.safeRemoveDocToRecycle(t,n.box)?(await this.cleanEmptyParentDocTree(t,n.hpath,n.box),{ok:!0,mergedCount:p,msg:`✓ 成功合并 ${p} 条流水至主日记，并已清理孤立文档`}):{ok:!0,mergedCount:p,msg:`内容已成功合并至主日记（${p}条），但移入回收站失败，请手动删除该孤立文档`}}catch(e){return{ok:!1,mergedCount:0,msg:`合并异常: ${e?.message||String(e)}`}}},async cleanEmptyParentDocTree(t,e,n){if(e.includes("/daily note/"))try{let o=e.split("/").filter(Boolean);for(;o.length>1;){o.pop();let r="/"+o.join("/");if(r==="/"||r==="")break;let l=`SELECT id FROM blocks WHERE box='${n.replace(/'/g,"''")}' AND hpath LIKE '${r.replace(/'/g,"''")}/%' AND id != '${t.replace(/'/g,"''")}' LIMIT 1`,c=await se("/api/query/sql",{stmt:l});if(c.code===0&&Array.isArray(c.data)&&c.data.length===0){let i=await se("/api/query/sql",{stmt:`SELECT id FROM blocks WHERE type='d' AND box='${n.replace(/'/g,"''")}' AND hpath='${r.replace(/'/g,"''")}' LIMIT 1`});i.code===0&&Array.isArray(i.data)&&i.data[0]?.id&&await this.safeRemoveDocToRecycle(String(i.data[0].id),n)}else break}}catch{}},generateAuditReportMarkdown(t){let e=new ae,n=`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")} ${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}:${String(e.getSeconds()).padStart(2,"0")}`,o=t.dupDocGroups.reduce((l,c)=>l+c.docs.length,0),r=["# 🐴 小驴生态 · 全思源查重与对账治理审计单",`> 审计时间：${n} · 治理中枢：小驴对账中枢 (lvDeduplicator v2.0)`,"","## 📊 一、 全库对账综述",`- **全库同名文档组**：${t.dupDocGroups.length} 组（共涉及 ${o} 篇文档）`,`- **同步冲突分叉文档**：${t.conflictDocs.length} 篇`,`- **今日日记重复流水**：${t.dupLifeLogState.duplicateGroups} 组`,`- **网页剪藏重复收录**：${t.dupClips.length} 组`,...t.currentDoc?.id?[`- **当前聚焦长文档**：《${t.currentDoc.title}》（发现 ${t.docDupBlocks?.length||0} 组重复内容块）`]:[],"","## 📑 二、 全库同名文档明细"];return t.dupDocGroups.length===0?r.push("✓ 全库文档标题唯一，无任何同名分叉。"):(r.push("| 序号 | 文档标题 | 推荐真身 (Path) | 真身属性 | 候选副本列表 |"),r.push("| :---: | :--- | :--- | :--- | :--- |"),t.dupDocGroups.forEach((l,c)=>{let i=l.docs.find(g=>g.id===l.recommendedKeepId)||l.docs[0],a=l.docs.filter(g=>g.id!==i?.id),d=`${i?`${i.length}字`:"-"}${i?.childCount?` · 含${i.childCount}子文档`:""}`,p=a.map(g=>`${g.hpath||"/"+g.id} (${g.length}字${g.childCount?`·含${g.childCount}子文档`:""})`).join("<br>");r.push(`| ${c+1} | 《${l.title}》 | \`${i?.hpath||"/"+i?.id}\` | ${d} | ${p||"无"} |`)})),r.push(""),r.push("## ⚡ 三、 同步冲突与分叉明细"),t.conflictDocs.length===0?r.push("✓ 未检测到带 (冲突) 或 _conflict_ 后缀的同步分叉文档。"):(r.push("| 序号 | 冲突文档标题 | 所在路径 | 字数 | 更新时间 |"),r.push("| :---: | :--- | :--- | :--- | :--- |"),t.conflictDocs.forEach((l,c)=>{r.push(`| ${c+1} | ${l.title} | \`${l.hpath}\` | ${l.length||0} 字 | ${sn(l.updated)} |`)})),t.dupClips.length>0&&(r.push(""),r.push("## 🌐 四、 重复网页剪藏明细"),r.push("| 序号 | 目标 URL | 重复收录篇数 | 文档列表 |"),r.push("| :---: | :--- | :---: | :--- |"),t.dupClips.forEach((l,c)=>{let i=(l.docs||[]).map(a=>`《${a.title}》(\`${a.hpath}\`)`).join("<br>");r.push(`| ${c+1} | [${l.url}](${l.url}) | ${l.count} | ${i} |`)})),r.push(""),r.push("---"),r.push("*小驴生态 · 100% 本地原生存储与隐私承诺 · 数据主权完整归您所有*"),r.join(`
`)},async cleanAllEmptyShells(t){let e=0,n=0;try{for(let o of t){let l=o.docs.filter(i=>i.length>0||(i.childCount||0)>0)[0]?.id||o.recommendedKeepId,c=o.docs.filter(i=>i.id!==l&&i.length===0&&(i.childCount||0)===0);if(c.length>0){n++;for(let i of c)await this.safeRemoveDocToRecycle(i.id,i.box)&&e++}}}catch{}return{cleanedCount:e,affectedGroups:n}},async renameDoc(t,e,n){let o=fa(e,"",120);if(!t||!o)return{ok:!1,error:"标题或文档 ID 为空"};try{let r=n,l="",c=`SELECT path, box FROM blocks WHERE id='${t.replace(/'/g,"''")}' LIMIT 1`,i=await se("/api/query/sql",{stmt:c});if(i.code===0&&Array.isArray(i.data)&&i.data[0]&&(r=r||i.data[0].box,l=String(i.data[0].path||"")),r||(r=(await se("/api/block/getBlockInfo",{id:t}))?.data?.box),!r)return{ok:!1,error:"无法解析笔记本 ID"};l||(l=`/${t}.sy`),l.endsWith(".sy")||(l+=".sy");let a=await se("/api/filetree/renameDoc",{notebook:r,path:l,title:o});return{ok:a.code===0,error:a.msg}}catch(r){return{ok:!1,error:r?.message||String(r)}}},async mergeDocBlocks(t,e,n){if(!t||!e)return{ok:!1,mergedCount:0,msg:"目标或来源文档 ID 为空"};if(t===e)return{ok:!1,mergedCount:0,msg:"同一文档无需合并"};try{let o=await se("/api/query/sql",{stmt:`SELECT id, type, content, markdown FROM blocks WHERE root_id='${e.replace(/'/g,"''")}' AND type IN ('p','h','i','b','c') AND length(content) > 0 ORDER BY sort ASC LIMIT 2000`}),r=o.code===0&&Array.isArray(o.data)?o.data:[],l=await se("/api/query/sql",{stmt:`SELECT content FROM blocks WHERE root_id='${t.replace(/'/g,"''")}' AND type IN ('p','h','i','b','c') LIMIT 2000`}),c=new Set;if(l.code===0&&Array.isArray(l.data))for(let d of l.data){let p=(d.content||"").replace(/[\r\n\t\s]+/g," ").trim();p&&c.add(p)}let i=[];for(let d of r){let p=(d.content||"").replace(/[\r\n\t\s]+/g," ").trim();if(!p||c.has(p))continue;let g="";typeof d.markdown=="string"&&d.markdown.trim()&&(g=d.markdown.replace(/\{:[^}]*\}\s*$/g,"").trim()),g||(g=String(d.content)),i.push(g)}let a=0;if(i.length>0){let d=i.join(`

`),p=await Fn(t,async()=>await se("/api/block/appendBlock",{parentID:t,data:d,dataType:"markdown"}));if(p.code!==0)return{ok:!1,mergedCount:0,msg:`追加内容失败: ${p.msg||"未知错误"}`};a=i.length}return n?.recycleSource!==!1&&await this.safeRemoveDocToRecycle(e,n?.sourceBox),{ok:!0,mergedCount:a,msg:a>0?`✓ 成功将 ${a} 处增量段落合并至真身，副本已安全归档`:"✓ 副本内容已完全包含在真身中，无新增段落，已直接归档副本"}}catch(o){return{ok:!1,mergedCount:0,msg:`合并异常: ${o?.message||String(o)}`}}},async batchMergeOrphanDailyNotes(){let t=await this.scanOrphanDailyNotes(),e=0,n=0;for(let o of t){let r=await this.mergeOrphanDailyNote(o.id);r.ok&&(r.mergedCount>0&&(e+=r.mergedCount),n++)}return{mergedTotal:e,cleanedTotal:n,count:t.length}},async aiSummarizeVaultHealth(t,e){if(e?.signal?.aborted)throw new Error("AI request aborted");let n=t.dupDocGroups.length,o=t.dupDocGroups.filter(E=>E.hasEmptyShell).length,r=t.dupDocGroups.filter(E=>E.isBenign).length,l=t.dupDocGroups.filter(E=>E.isSuspectedFork&&!E.isBenign).length,c=t.conflictDocs.length,i=t.orphanDailyNotes.length,a=c*12+o*4+l*5+i*6,d=Math.max(30,Math.min(100,100-a)),p="good";d>=95?p="excellent":d>=80?p="good":d>=60?p="warning":p="danger";let g=[];c>0&&g.push(`优先治理 ${c} 篇同步冲突分叉，防止跨设备编辑丢失增量`),o>0&&g.push(`一键清理 ${o} 组误建的 0 字空壳，快速净化知识库树`),l>0&&g.push(`对 ${l} 组同目录疑似版本分叉执行【双栏对比与增量合并】`),r>0&&g.push(`已自动智能保护 ${r} 组月份/结构同名，避免误删`),i>0&&g.push(`建议一键将 ${i} 篇插件专属本误建日记无损迁移回主日记`),g.length===0&&g.push("全库文档健康度极佳，无冗余分叉与空壳！");let h="";try{let E=`你是一位知识库架构与数据健康诊断专家。根据以下思源笔记全库对账指标：
- 全库同名文档组：${n} 组（其中合法时间结构 ${r} 组，含 0 字空壳 ${o} 组，疑似分叉 ${l} 组）
- 同步冲突文档：${c} 篇
- 跨笔记本孤立日记：${i} 篇
- 健康评分：${d} 分
请用简练、专业、鼓励性的两句话（不超过80字）向用户给出宏观评价与处置重心：`,S=q.LvAiRouter||q.__LV_AI_ROUTER__;if(S&&typeof S.chat=="function"){let P=await S.chat({messages:[{role:"user",content:E}],taskType:"summary",signal:e?.signal});if(e?.signal?.aborted)throw new Error("AI request aborted");P.ok&&P.content&&(h=P.content.trim())}!h&&!e?.signal?.aborted&&(h=await Da(E,e?.signal))}catch(E){if(e?.signal?.aborted)throw E}if(e?.signal?.aborted)throw new Error("AI request aborted");h||(h=d>=90?"全库数据架构基本健康，仅有少量零星空壳或历史分叉，处置后即可达到极简纯净状态。":"检测到多端同步分叉或部分误建空壳，建议优先一键清理 0 字空壳，并对冲突文档执行增量合并。");let T=`
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                <div style="font-size:24px;font-weight:800;color:${d>=85?"#10b981":d>=70?"#f59e0b":"#ef4444"};">
                    ${d}<span style="font-size:12px;font-weight:600;opacity:.8;">/100分</span>
                </div>
                <div style="flex:1;font-size:11.5px;color:var(--lv-lp-text);line-height:1.5;">
                    <strong>AI 参谋综述：</strong>${v(h)}
                </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:10.5px;">
                ${g.map(E=>`<span style="padding:2px 8px;border-radius:5px;background:rgba(37,99,235,0.08);color:var(--lv-lp-accent,#2563eb);border:1px solid var(--lv-lp-border);">💡 ${v(E)}</span>`).join("")}
            </div>
        `;return{score:d,level:p,summaryHtml:T,recommendations:g}},async saveAuditReportToHub(t){try{let e=new ae,n=`${e.getFullYear()}${String(e.getMonth()+1).padStart(2,"0")}${String(e.getDate()).padStart(2,"0")}`,o=`${String(e.getHours()).padStart(2,"0")}${String(e.getMinutes()).padStart(2,"0")}${String(e.getSeconds()).padStart(2,"0")}`,r=`对账审计报告-${n}-${o}`,c=((await se("/api/notebook/lsNotebooks",{}))?.data?.notebooks||[]).find(a=>!a.closed&&/^(🐴\s*)?小驴(生态|空间|笔记本)/.test(a.name));if(!c?.id)return{ok:!1};let i=await se("/api/filetree/createDocWithMd",{notebook:c.id,path:`/99-生态杂项/${r}`,markdown:t});if(i.code===0&&i.data)return{ok:!0,path:`/99-生态杂项/${r}`,docId:String(i.data)}}catch{}return{ok:!1}}};function qo(t,e,n="all"){let o=t.filter(i=>i.level==="warn"||i.level==="error").length,r=t.filter(i=>i.category==="siyuan-native"||i.source==="思源原生").length,l=t.filter(i=>n==="unread"?!i.read:n==="alert"?i.level==="warn"||i.level==="error":n==="siyuan"?i.category==="siyuan-native"||i.source==="思源原生":!0),c="";if(l.length===0)c=`
          <div class="lv-inbox-empty" style="text-align:center;padding:22px 12px;color:var(--lv-lp-text-sub,#64748b);font-size:12px;">
            ${n==="unread"?"✨ 太棒了，所有通知均已阅读":n==="alert"?"🛡️ 今日暂无告警或异常消息":n==="siyuan"?"📋 暂无思源原生消息记录（出现同步/报错/插件提示时自动归档）":"🌱 今日通知中心暂无消息，工作区静悄悄"}
          </div>
        `;else{let i="";l.slice(0,40).forEach(a=>{let d=!a.read,p=a.category==="siyuan-native"||a.source==="思源原生",g=v(a.source||"小驴"),h=a.title?v(a.title):"",T=v(a.message||""),E=fo(a.createdAt||ae.now()),S=xa(a.createdAt||ae.now());S!==i&&(i=S,c+=`<div class="lv-inbox-day-sep" aria-hidden="true">— ${v(S)} —</div>`);let P=a.level==="error"?"🛑":a.level==="warn"?"⚠️":a.level==="success"?"✅":"ℹ️",j=(a.repeatCount||1)>1?`<span class="lv-inbox-repeat" style="font-size:10px;font-weight:700;padding:0.5px 5px;border-radius:999px;background:rgba(245,158,11,0.14);color:var(--b3-theme-warning,#d97706);">×${a.repeatCount}</span>`:"",D=p?"font-size:10px;font-weight:600;padding:1px 5px;border-radius:4px;background:rgba(100,116,139,0.14);color:var(--lv-lp-text-sub,#475569);":"font-size:10px;font-weight:600;padding:1px 5px;border-radius:4px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:var(--lv-lp-accent,#2563eb);",f="";if(a.action&&a.action.label){let L=v(a.action.label);f=`
                  <button type="button" class="lv-pop-sub-btn lv-inbox-action-btn" data-inbox-id="${v(a.id)}" style="padding:2px 7px;font-size:10.5px;color:var(--lv-lp-accent,#2563eb);border-color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">
                    ${L}
                  </button>
                `}c+=`
              <div class="lv-inbox-item ${d?"unread":""}" data-inbox-id="${v(a.id)}" ${d?'title="点击标为已读"':""} style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:8px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));position:relative;margin-bottom:5px;${d?"cursor:pointer;":""}">
                ${d?'<span style="width:6px;height:6px;border-radius:50%;background:var(--lv-lp-accent,#2563eb);position:absolute;top:8px;left:4px;" title="未读"></span>':""}
                <span style="font-size:13px;line-height:1;margin-top:2px;" aria-hidden="true">${P}</span>
                <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                    <div style="display:flex;align-items:center;gap:5px;min-width:0;flex-wrap:wrap;">
                      <span class="lv-inbox-source-tag" style="${D}">${g}</span>
                      ${h?`<strong style="font-size:12px;color:var(--lv-lp-text,#0f172a);">${h}</strong>`:""}
                      ${j}
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
                      <button type="button" class="lv-pop-sub-btn lv-inbox-copy-btn" data-inbox-id="${v(a.id)}" title="复制通知文本" style="padding:1px 5px;font-size:10px;opacity:0.8;">复制</button>
                      <span style="font-size:10px;color:var(--lv-lp-text-sub,#64748b);">${E}</span>
                    </div>
                  </div>
                  <div style="font-size:11.5px;color:var(--lv-lp-text,#0f172a);line-height:1.4;word-break:break-word;">
                    ${T}
                  </div>
                </div>
                ${f}
              </div>
            `})}return`
      <div class="lv-pop-inbox-drawer" style="padding:12px 14px;background:var(--lv-lp-panel-bg,#f8fafc);display:flex;flex-direction:column;gap:8px;flex:1 1 auto;min-height:0;overflow-y:auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:8px;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));flex-wrap:wrap;gap:6px;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <button type="button" class="lv-pop-sub-btn lv-pop-inbox-btn" title="返回罗盘主页" style="padding:2.5px 8px;font-size:11px;">← 返回</button>
            <span style="font-weight:700;font-size:12.5px;color:var(--lv-lp-accent,#2563eb);">🔔 通知中心</span>
            <div class="lv-pop-view-tabs" role="tablist" aria-label="通知筛选">
              <button type="button" role="tab" aria-selected="${n==="all"}" class="lv-pop-view-tab lv-inbox-filter-btn ${n==="all"?"active":""}" data-inbox-filter="all">全部 ${t.length}</button>
              <button type="button" role="tab" aria-selected="${n==="unread"}" class="lv-pop-view-tab lv-inbox-filter-btn ${n==="unread"?"active":""}" data-inbox-filter="unread">未读 ${e}</button>
              <button type="button" role="tab" aria-selected="${n==="alert"}" class="lv-pop-view-tab lv-inbox-filter-btn ${n==="alert"?"active":""}" data-inbox-filter="alert">告警 ${o}</button>
              <button type="button" role="tab" aria-selected="${n==="siyuan"}" class="lv-pop-view-tab lv-inbox-filter-btn ${n==="siyuan"?"active":""}" data-inbox-filter="siyuan">思源 ${r}</button>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:5px;">
            <button type="button" class="lv-pop-sub-btn lv-inbox-diag-btn" title="复制生态诊断报告（运行环境/插件矩阵/最近错误），粘贴给开发者即可定位问题" style="padding:2.5px 8px;font-size:10.5px;">🩺 诊断</button>
            <button type="button" class="lv-pop-sub-btn lv-inbox-mark-all-btn" title="标记全部为已读" style="padding:2.5px 8px;font-size:10.5px;">✓ 全部已读</button>
            <button type="button" class="lv-pop-sub-btn lv-inbox-clear-btn" title="清空全部通知历史" style="padding:2.5px 8px;font-size:10.5px;">清空</button>
          </div>
        </div>
        <div class="lv-inbox-rows" style="display:flex;flex-direction:column;padding-top:2px;">
          ${c}
        </div>
      </div>
    `}function So(t){let e="";t.metrics.forEach(o=>{let r=o.status==="done",l=o.status==="uninstalled",c=r?"done":o.status==="pending"?"pending":l?"uninstalled":"empty",i=l?`${v(o.name)} (未安装/未加载)`:`${v(o.name)}：${v(o.label)} · 点击直达`,a=nt(o.pluginId,o.color),d=r?"✓":o.count>0?String(o.count):o.status==="empty"?"–":"0";e+=`
          <button type="button" class="lv-pop-ticker-pill ${c}" data-recent-id="${v(o.pluginId)}" title="${i}">
            <span class="lv-pop-ticker-dot" style="background:${a};"></span>
            <span class="lv-pop-ticker-name">${v(o.shortName)}</span>
            <strong class="lv-pop-ticker-val">${d}</strong>
          </button>
        `});let n=t.allDone?'<span class="lv-pop-ticker-all-done" title="今日全生态任务全部达成">✓ 全达成</span>':"";return`
      <div class="lv-pop-today-ticker" role="region" aria-label="今日状态微报">
        <span class="lv-pop-ticker-label">📊 今日</span>
        <div class="lv-pop-ticker-pills">
          ${e}
        </div>
        ${n}
      </div>
    `}function To(t,e){if(!t)return"";let n=Array.isArray(t.actions)&&t.actions.length>0?t.actions:[`打开${t.fullName||t.name}主界面`],o=n.length,r=e==="all"?n:n.slice(0,Number(e)||3),l=v(t.fullName&&!t.fullName.includes("<")?t.fullName:t.name||""),c=v(t.id),i=e==="all"?`收起至前 3 项 (共 ${o} 项)`:o>r.length?`精选前 ${r.length} 项 · 展开全部 (${o})`:`共 ${o} 项快捷行动`,a="",d=e!=="all"&&r.length>=2;r.forEach(g=>{let h=v(String(g));a+=`
          <button type="button" class="lv-pop-action-row" data-action-plugin="${c}" data-action-name="${h}" title="${h}">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">⚡ ${h}</span>
            ${d?"":'<span style="font-size:10.5px;color:var(--lv-lp-text-sub,#64748b);flex-shrink:0;margin-left:8px;">↵ 执行</span>'}
          </button>
        `});let p=d?`display:grid;grid-template-columns:repeat(${Math.min(3,r.length)},minmax(0,1fr));gap:6px;`:r.length>=4?"display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;":"display:flex;flex-direction:column;gap:4px;";return`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
        <span class="lv-pop-actions-title" style="font-size:11px;font-weight:700;color:var(--lv-lp-accent,#2563eb);">⚡ ${l} · 极速二级行动直达</span>
        <button type="button" class="lv-pop-actions-limit-btn" style="border:none;background:transparent;font-size:10.5px;color:var(--lv-lp-text-sub,#64748b);cursor:pointer;padding:1px 4px;font-family:inherit;">${v(i)}</button>
      </div>
      <div class="lv-pop-actions-list" style="${p}">
        ${a}
      </div>
    `}function Sn(t,e,n){let o=n?.view||"grid",r=Math.max(0,Math.min(n?.focusedIndex??0,Math.max(0,t.length-1))),l=!!n?.showPrefDrawer,c=!!n?.showInboxDrawer,i=n?.inboxFilter||"all",a=n?.actionLimit??3,d=n?.recentIds??Jn(),p=n?.allItems??t,g=bt(),h=nn(),T=N.getUnreadCount(),E=e?"收敛全部到小驴罗盘 (新版极简模式)":"平铺全部独立图标到顶栏 (恢复老版布局)",S=e?"收敛":"平铺",P='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;fill:none!important;stroke:currentColor!important;vertical-align:-1px;" aria-hidden="true"><path d="M12 17v5" fill="none"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" fill="none"/></svg>',j='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;fill:none!important;stroke:currentColor!important;flex-shrink:0;color:var(--lv-lp-text-sub,#64748b);" aria-hidden="true"><circle cx="11" cy="11" r="8" fill="none"/><line x1="21" y1="21" x2="16.65" y2="16.65" fill="none"/></svg>',D=g?`🌙 至${new ae(h).toTimeString().slice(0,5)}`:"🌙 专注",f=`
      <div class="lv-pop-header">
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:7px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">${ya}</span>
          <span style="font-weight:700;font-size:13.5px;color:var(--lv-lp-text,#0f172a);white-space:nowrap;letter-spacing:-0.01em;">小驴罗盘</span>
          <span style="font-size:10.5px;font-weight:600;padding:1.5px 6.5px;border-radius:999px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:var(--lv-lp-accent,#2563eb);white-space:nowrap;flex-shrink:0;" title="当前接入小驴罗盘的插件数量（数字键 1-8 可瞬发对应磁贴）">${t.length} 联结</span>
        </div>
        <div style="display:flex;align-items:center;gap:3px;flex-shrink:0;">
          <div class="lv-pop-view-tabs" role="tablist" aria-label="视图切换">
            <button type="button" role="tab" aria-selected="${o==="grid"}" class="lv-pop-view-tab ${o==="grid"?"active":""}" data-view="grid">九宫格</button>
            <button type="button" role="tab" aria-selected="${o==="list"}" class="lv-pop-view-tab ${o==="list"?"active":""}" data-view="list">列表</button>
          </div>
          <button type="button" class="lv-pop-sub-btn lv-pop-focus-btn ${g?"active":""}" title="${g?"点击退出全局专注模式":"开启全局专注模式（静音通知至今晚）"}">${v(D)}</button>
          <button type="button" class="lv-pop-sub-btn lv-pop-inbox-btn ${c?"active":""}" aria-label="通知中心" title="全生态通知中心历史（${T} 未读）">🔔${T>0?`<span class="lv-pop-inbox-badge">${T}</span>`:""}</button>
          <button type="button" class="lv-pop-sub-btn lv-pop-pref-btn ${l?"active":""}" aria-label="设置" title="顶栏与罗盘坞内显隐及跨插件联动设置">⚙ 设置</button>
          <button type="button" class="lv-pop-sub-btn lv-pop-toggle-all-btn" title="${E}">${P}<span>${S}</span></button>
          <button type="button" class="lv-pop-sub-btn lv-pop-close-btn" aria-label="关闭" title="关闭 (Esc)" style="padding:3px 6px;">✕</button>
        </div>
      </div>
    `,L="";if(l){let s="";p.forEach((k,$)=>{let O=v(k.id),Z=v(k.fullName&&!k.fullName.includes("<")?k.fullName:k.name||k.id),m=nt(k.id,k.color),u=Wt(k.id,15),w=$===0,x=$===p.length-1;s+=`
              <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 0;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
                <div style="display:flex;align-items:center;gap:7px;min-width:0;flex:1;">
                  <span style="color:${m};display:inline-flex;align-items:center;flex-shrink:0;">${u}</span>
                  <strong style="font-size:12.5px;color:var(--lv-lp-text,#0f172a);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Z}</strong>
                </div>
                <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
                  <button type="button" class="lv-pop-sub-btn lv-pop-order-up-btn" data-order-id="${O}" title="上移磁贴" aria-label="上移" ${w?"disabled":""} style="padding:2px 6px;font-size:11px;min-width:24px;opacity:${w?"0.4":"1"};">↑</button>
                  <button type="button" class="lv-pop-sub-btn lv-pop-order-down-btn" data-order-id="${O}" title="下移磁贴" aria-label="下移" ${x?"disabled":""} style="padding:2px 6px;font-size:11px;min-width:24px;opacity:${x?"0.4":"1"};">↓</button>
                  <select class="lv-pop-state-select" data-state-id="${O}" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);padding:3px 6px;border-radius:6px;font-size:11.5px;font-family:inherit;cursor:pointer;max-width:142px;">
                    <option value="docked" ${k.state==="docked"?"selected":""}>📥 仅在罗盘坞内</option>
                    <option value="pinned" ${k.state==="pinned"?"selected":""}>📌 置顶在外</option>
                    <option value="hidden" ${k.state==="hidden"?"selected":""}>👁️ 彻底隐藏</option>
                  </select>
                </div>
              </div>
            `});let I=Kt.getRules(),B="";I.length>0?I.forEach(k=>{B+=`
                  <label style="padding:7px 10px;border-radius:8px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;">
                    <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
                      <span style="font-size:12px;font-weight:600;color:var(--lv-lp-text,#0f172a);">${v(k.name)}</span>
                      <span style="font-size:10.5px;color:var(--lv-lp-text-sub,#64748b);">${v(k.desc||`${k.triggerSource} → ${k.actionPlugin}`)}</span>
                    </div>
                    <input type="checkbox" class="lv-pop-rule-toggle" data-rule-id="${v(k.id)}" ${k.enabled?"checked":""} style="cursor:pointer;flex-shrink:0;" />
                  </label>
                `}):B='<div style="font-size:11.5px;color:var(--lv-lp-text-sub,#64748b);padding:6px 2px;">各插件启动后注册的跨插件 IFTTT 规则将在此统一管控</div>',L=`
          <div class="lv-pop-pref-drawer" style="padding:12px 16px;background:var(--lv-lp-panel-bg,#f8fafc);display:flex;flex-direction:column;gap:8px;flex:1 1 auto;min-height:0;overflow-y:auto;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-bottom:6px;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
              <div style="display:flex;align-items:center;gap:6px;">
                <button type="button" class="lv-pop-sub-btn lv-pop-pref-btn" title="返回罗盘主页" style="padding:2.5px 8px;font-size:11px;">← 返回</button>
                <span style="font-weight:700;font-size:12.5px;color:var(--lv-lp-accent,#2563eb);">⚙ 顶栏与工作台设置</span>
              </div>
              <span class="lv-pop-save-toast" role="status" aria-live="polite">✓ 已保存</span>
            </div>
            <div style="background:var(--lv-lp-accent-soft,rgba(37,99,235,0.08));border:1px solid rgba(37,99,235,0.2);padding:7px 11px;border-radius:8px;font-size:11.5px;line-height:1.5;color:var(--lv-lp-text,#0f172a);">
              👋 <strong>顶栏与罗盘主权设置</strong>：自主决定哪些插件<strong>常驻在思源顶栏</strong>，哪些<strong>仅在罗盘坞内收敛</strong>，哪些<strong>彻底隐藏</strong>。
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px;flex-wrap:wrap;">
              <div style="font-weight:700;font-size:12px;color:var(--lv-lp-accent,#2563eb);">📌 顶栏与罗盘图标显隐及排序</div>
              <button type="button" class="lv-pop-sub-btn lv-pop-reset-order-btn" title="恢复插件磁贴默认排序" style="padding:2px 8px;font-size:10.5px;">↺ 恢复默认顺序</button>
            </div>
            <div>${s}</div>
            <div style="font-weight:700;font-size:12px;color:var(--lv-lp-accent,#2563eb);margin-top:4px;">⚡ 极速工作台与移动端入口配置</div>
            <div style="display:flex;flex-direction:column;gap:7px;padding:6px 0;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span style="font-size:12px;color:var(--lv-lp-text,#0f172a);">LifeLog 分类（逗号分隔）</span>
                <input type="text" class="lv-pop-lifelog-cats-input b3-text-field" value="${v(Qe().lifeLogCategories.join(", "))}" style="font-size:11.5px;padding:3px 8px;border-radius:6px;width:196px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);" />
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span style="font-size:12px;color:var(--lv-lp-text,#0f172a);">日记目标笔记本</span>
                <select class="lv-pop-notebook-select" data-selected-nb="${v(Qe().lifeLogNotebookId||"")}" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);padding:3px 8px;border-radius:6px;font-size:11.5px;width:196px;cursor:pointer;">
                  <option value="">✨ 自动识别默认日记本</option>
                  ${Qe().lifeLogNotebookId?`<option value="${v(Qe().lifeLogNotebookId||"")}" selected>📔 已选: 当前日记本</option>`:""}
                </select>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span style="font-size:12px;color:var(--lv-lp-text,#0f172a);">手机端罗盘入口形态</span>
                <select class="lv-pop-mobile-mode-select" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);padding:3px 8px;border-radius:6px;font-size:11.5px;width:196px;cursor:pointer;">
                  <option value="both" ${xt()==="both"?"selected":""}>🔘 悬浮球 + 顶栏按钮 (推荐)</option>
                  <option value="ball" ${xt()==="ball"?"selected":""}>🎯 仅悬浮球</option>
                  <option value="topbar" ${xt()==="topbar"?"selected":""}>📌 仅顶栏按钮</option>
                  <option value="none" ${xt()==="none"?"selected":""}>🙈 隐藏手机端入口</option>
                </select>
              </div>
            </div>
            ${(()=>{let k=N.getMutedCategories?N.getMutedCategories():[];if(!k.length)return"";let $="";return k.forEach(O=>{$+=`
                      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));font-size:11.5px;">
                        <div>
                          <strong style="color:var(--lv-lp-text,#0f172a);">${v(O.category)}</strong>
                          <span style="font-size:10.5px;color:var(--lv-lp-text-sub,#64748b);margin-left:6px;">至 ${v(O.untilStr)}</span>
                        </div>
                        <button type="button" class="lv-pop-unmute-btn" data-unmute-cat="${v(O.category)}" style="background:transparent;border:1px solid var(--lv-lp-border);border-radius:4px;padding:1px 6px;font-size:10.5px;cursor:pointer;color:var(--lv-lp-accent,#2563eb);">解除静音</button>
                      </div>
                    `}),`
                  <div style="font-weight:700;font-size:12px;color:var(--lv-lp-accent,#2563eb);margin-top:4px;">🔕 已设免打扰提醒分类 (${k.length})</div>
                  <div style="display:flex;flex-direction:column;gap:3px;">${$}</div>
                `})()}
            ${(()=>{let k=typeof q<"u"&&q.loadAiRouterConfig?q.loadAiRouterConfig():{enableSiyuan:!0,enableRuleFallback:!0,publicFree:{enabled:!1},ollama:{enabled:!0,baseUrl:"http://127.0.0.1:11434"}},$=k.preferredProvider||"auto";return`
                  <div style="font-weight:700;font-size:12px;color:var(--lv-lp-accent,#2563eb);margin-top:6px;display:flex;align-items:center;justify-content:space-between;">
                    <span>🤖 小驴全生态 AI 智能调度中枢</span>
                    <button type="button" class="lv-pop-sub-btn lv-ai-test-all-btn" title="一键测试全部五级通道连通性与响应延迟" style="padding:1.5px 7px;font-size:10px;">🧪 全级测速</button>
                  </div>
                  <div style="background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.18);padding:6px 10px;border-radius:6px;font-size:11px;line-height:1.45;color:var(--lv-lp-text);">
                    💡 <strong>全家桶共享</strong>：在此配置一次，闪卡拟题、考试分析、打卡解析、罗盘对账等 8 大插件<strong>全域即刻生效</strong>。默认五级自适应瀑布降级（思源 ➔ 用户Key ➔ 本地Ollama ➔ 免费通道 ➔ 离线规则）。
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0;">
                    <span style="font-size:11.5px;color:var(--lv-lp-text);">首选通道模式</span>
                    <select class="lv-ai-pref-provider-select" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);padding:3px 8px;border-radius:6px;font-size:11px;width:196px;cursor:pointer;">
                      <option value="auto" ${$==="auto"?"selected":""}>🌊 五级自适应瀑布流 (推荐)</option>
                      <option value="siyuan" ${$==="siyuan"?"selected":""}>🟢 优先思源内核智能体</option>
                      <option value="user_custom" ${$==="user_custom"?"selected":""}>🔵 优先自填 Key (OpenAI)</option>
                      <option value="ollama" ${$==="ollama"?"selected":""}>🟣 优先本地 Ollama (100%离线)</option>
                      <option value="public_free" ${$==="public_free"?"selected":""}>🌐 优先免密免费通道</option>
                      <option value="rule_fallback" ${$==="rule_fallback"?"selected":""}>⚡ 强制纯离线规则 (无网络)</option>
                    </select>
                  </div>
                  <div class="lv-pop-ai-hub-slot">
                    ${H.getAiHubUi?.()?`${oa($)}
${aa(k,!0)}`:'<div class="lv-pop-ai-hub-loading" style="padding:10px 12px;border-radius:8px;border:1px dashed var(--lv-lp-border,rgba(15,23,42,0.14));font-size:11.5px;color:var(--lv-lp-text-sub,#64748b);text-align:center;">⏳ 正在加载 AI 调度中枢…</div>'}
                  </div>
                `})()}
            <div style="font-weight:700;font-size:12px;color:var(--lv-lp-accent,#2563eb);margin-top:4px;">⚡ 跨插件智能自动化规则 (IFTTT)</div>
            <div style="display:flex;flex-direction:column;gap:5px;">${B}</div>
          </div>
        `}let y="";c&&(y=qo(N.getHistory(),T,i));let A=`
      <div class="lv-pop-search-bar">
        ${j}
        <input type="text" class="lv-pop-search-input" placeholder="搜索全家桶 (习惯 / 切片 / 闪卡 / 人脉 · 按 / 聚焦)..." aria-label="全生态穿透搜索" autocomplete="off" />
        <button type="button" class="lv-pop-search-clear" aria-label="清空搜索" title="清空搜索">✕</button>
        <span class="lv-pop-kbd">/</span>
      </div>
      <div class="lv-pop-search-history" aria-label="最近搜索"></div>
    `,Q=et(),re=!!Q?.getItem(it)?.trim(),fe=!!Q?.getItem(rt)?.trim(),pe=`
      <div class="lv-pop-quick-wrap">
        <div class="lv-pop-quick-strip" role="toolbar" aria-label="极速工作台快捷操作">
          <button type="button" class="lv-pop-quick-pill lv-quick-note-btn" title="一键记事：快速输入并追加至今日日记或当前文档 (快捷键 N)" aria-keyshortcuts="N">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">⚡</span><span class="lv-quick-pill-text">一键记事</span>${re?'<span style="width:5px;height:5px;border-radius:50%;background:#ef4444;display:inline-block;margin-left:2px;" title="有未保存草稿"></span>':""}</span><span class="lv-quick-pill-key">N</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-lifelog-btn" title="叶归 LifeLog：带时间戳与分类流写入日记 (快捷键 L)" aria-keyshortcuts="L">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">📒</span><span class="lv-quick-pill-text">LifeLog</span>${fe?'<span style="width:5px;height:5px;border-radius:50%;background:#ef4444;display:inline-block;margin-left:2px;" title="有未保存草稿"></span>':""}</span><span class="lv-quick-pill-key">L</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-clip-btn" title="剪贴入库：文本带时间戳入库 · 图片自动存入 assets · 长内容预览确认 (快捷键 V)" aria-keyshortcuts="V">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">📋</span><span class="lv-quick-pill-text">剪贴入库</span></span><span class="lv-quick-pill-key">V</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-diary-bottom-btn" title="直达日记底部：打开今日日记并滚动至末行自动定位光标 (快捷键 B)" aria-keyshortcuts="B">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">⬇️</span><span class="lv-quick-pill-text">日记底部</span></span><span class="lv-quick-pill-key">B</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-task-mgr-btn" title="任务管理器：进入 Task Horizon 跨文档看板 (快捷键 T)" aria-keyshortcuts="T">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">📋</span><span class="lv-quick-pill-text">任务管理</span></span><span class="lv-quick-pill-key">T</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-new-task-btn" title="新建任务：打开任务管理器快速新建任务窗口 (快捷键 K)" aria-keyshortcuts="K">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">➕</span><span class="lv-quick-pill-text">新建任务</span></span><span class="lv-quick-pill-key">K</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-random-walk-btn" title="随机漫步：穿透知识库随机抽取并打开历史笔记 (快捷键 W)" aria-keyshortcuts="W">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">🎲</span><span class="lv-quick-pill-text">随机漫步</span></span><span class="lv-quick-pill-key">W</span>
          </button>
          <button type="button" class="lv-pop-quick-pill lv-quick-reload-btn" title="重新加载页面：刷新思源界面以应用最新插件、样式或代码片段 (快捷键 R，等效 Ctrl+R)" aria-keyshortcuts="R">
            <span class="lv-quick-pill-left"><span class="lv-quick-pill-icon">🔄</span><span class="lv-quick-pill-text">重新加载</span></span><span class="lv-quick-pill-key">R</span>
          </button>
        </div>
      </div>
    `,U=n?.todaySummary??vn(t),de=So(U),J=n?.allItems?n.allItems.length:t.length,le=t.length===0?J>0?`<div class="lv-pop-empty" style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px 16px;text-align:center;color:var(--lv-lp-text-sub,#64748b);font-size:12.5px;"><div>已隐藏全部 ${J} 个已入驻插件</div><button type="button" class="lv-pop-restore-hidden-btn" style="background:var(--lv-lp-accent,#2563eb);color:#fff;border:none;border-radius:999px;padding:6px 16px;font-size:12px;font-weight:600;cursor:pointer;">恢复显示全部隐藏插件</button></div>`:'<div class="lv-pop-empty" style="grid-column:1/-1;padding:24px 16px;text-align:center;color:var(--lv-lp-text-sub,#64748b);font-size:12.5px;">尚未有插件入驻罗盘</div>':"",b="";o==="list"?(b='<div class="lv-pop-list" style="display:flex;flex-direction:column;gap:5px;padding:8px 12px;flex:1 1 auto;min-height:0;overflow-y:auto;max-height:440px;">',le&&(b+=le),t.forEach((s,I)=>{let B=I+1,k=s.state==="pinned",$=I===r,O=k?"已置顶在顶栏 (点击收敛回罗盘)":"置顶到顶栏独立显示",Z=s.badgeType?`lv-badge-${s.badgeType}`:"lv-badge-primary",m=v(s.name),u=v(s.fullName||s.name),w=s.fullName&&!s.fullName.includes("<")&&!s.name.startsWith("小驴")?u:m,x=v(s.desc||s.fullName||""),M=v(String(s.badge??"")),_=v(s.id),W=nt(s.id,s.color),ce=s.badge?`<span class="lv-pop-badge ${v(Z)}" style="margin-top:0;">${M}</span>`:"",te=vo(s,17);b+=`
              <div class="lv-pop-tile lv-pop-list-item ${$?"lv-pop-tile-focused":""}" style="--tile-brand:${W};" data-idx="${I}" data-id="${_}" data-fullname="${u}">
                <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
                  <div class="lv-pop-icon-wrap" style="width:32px;height:32px;border-radius:9px;margin-bottom:0;color:${W};">
                    ${te}
                  </div>
                  <span style="font-weight:650;font-size:13.5px;color:var(--lv-lp-text,#0f172a);white-space:nowrap;">${w}</span>
                  ${w!==m?`<span style="display:none;">${m}</span>`:""}
                  <span style="font-size:11.5px;color:var(--lv-lp-text-sub,#64748b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                  ${ce}
                  <span style="font-size:10px;font-weight:700;font-family:monospace;padding:1px 5px;border-radius:4px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));color:var(--lv-lp-text-sub,#64748b);">${B}</span>
                  <button type="button" class="lv-pop-pin-btn" data-pin-id="${_}" title="${O}" style="display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;color:${k?"var(--lv-lp-accent,#2563eb)":"var(--lv-lp-text-sub,#64748b)"};opacity:${k?"1":"0.35"};padding:3px;border-radius:4px;">${P}</button>
                </div>
              </div>
            `}),b+="</div>"):(b=`<div class="lv-pop-grid" style="display:grid;grid-template-columns:${t.length>=3?"repeat(3, minmax(0, 1fr))":"repeat(2, minmax(0, 1fr))"};gap:8px;padding:8px 14px 10px;flex:1 1 auto;min-height:0;overflow-y:auto;">`,le&&(b+=le),t.forEach((I,B)=>{let k=B+1,$=I.state==="pinned",O=B===r,Z=d[0]===I.id&&t.length>1,m=$?"已置顶在顶栏 (点击收敛回罗盘)":"置顶到顶栏独立显示",u=I.badgeType?`lv-badge-${I.badgeType}`:"lv-badge-primary",w=I.badgeType||"primary",x=v(I.name),M=v(I.fullName||I.name),_=I.fullName&&!I.fullName.includes("<")&&!I.name.startsWith("小驴")?M:x,W=v(I.desc||I.fullName||""),ce=v(String(I.badge??"")),te=v(I.id),ye=nt(I.id,I.color),V=I.badge?`<span class="lv-pop-badge ${v(u)}">${ce}</span>`:"",xe=I.badge?`<span class="lv-pop-status-dot ${v(w)}" title="${ce}"></span>`:"",Ie=Z?'<span style="font-size:9px;font-weight:700;padding:0.5px 4.5px;border-radius:4px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:var(--lv-lp-accent,#2563eb);line-height:1.4;">最近</span>':"",He=vo(I,19);b+=`
              <div class="lv-pop-tile ${O?"lv-pop-tile-focused":""}" style="--tile-brand:${ye};" data-idx="${B}" data-id="${te}" data-fullname="${M}">
                <span class="lv-pop-key" style="position:absolute;top:6px;left:6px;font-size:9.5px;font-weight:700;font-family:monospace;padding:0 4.5px;border-radius:5px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));color:var(--lv-lp-text-sub,#64748b);line-height:1.55;">${k}</span>
                <button type="button" class="lv-pop-pin-btn" data-pin-id="${te}" title="${m}" style="position:absolute;top:5px;right:5px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;color:${$?"var(--lv-lp-accent,#2563eb)":"var(--lv-lp-text-sub,#64748b)"};opacity:${$?"1":"0.28"};padding:3px;border-radius:4px;">${P}</button>
                <div class="lv-pop-icon-wrap" style="color:${ye};">
                  ${He}
                  ${xe}
                </div>
                <div style="display:flex;align-items:center;justify-content:center;gap:4px;width:100%;min-width:0;">
                  <span class="lv-pop-title" style="font-weight:650;font-size:13.5px;color:var(--lv-lp-text,#0f172a);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_}</span>
                  ${_!==x?`<span style="display:none;">${x}</span>`:""}
                  ${Ie}
                </div>
                <span class="lv-pop-desc" style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);margin-top:2.5px;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${W}</span>
                ${V}
              </div>
            `}),b+="</div>");let K='<div class="lv-pop-omni-results" style="display:none;flex-direction:column;gap:6px;padding:10px 14px;max-height:310px;overflow-y:auto;"></div>',ue=t[r]||t[0],ge=`
      <div class="lv-pop-actions-drawer">
        ${To(ue,a)}
      </div>
    `,z=0;try{z=ln.getTodayRecords().length}catch{}let G=`
      <div class="lv-pop-footer" style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:7px 12px;border-top:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));background:var(--lv-lp-card-bg,#ffffff);flex-shrink:0;font-size:11px;color:var(--lv-lp-text-sub,#64748b);">
        <div style="display:flex;align-items:center;gap:4px;white-space:nowrap;flex-shrink:0;" title="${t.length} 插件协同 · 今日活动 ${z} 项 · P 键置顶">
          <span class="lv-pop-pulse-dot"></span>
          <span>${t.length}协同 · 活动<strong style="color:var(--lv-lp-text,#0f172a);">${z}</strong>项</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
          <button type="button" class="lv-pop-sub-btn lv-pop-store-btn" title="打开全能块助手资产库，分类装配块级能力与快捷栏">📦 块助手</button>
          <button type="button" class="lv-pop-sub-btn lv-pop-diary-btn" title="将今日全生态活动汇总写入日记或复制">📝 回顾</button>
          <button type="button" class="lv-pop-sub-btn lv-pop-backup-btn" title="一键导出小驴全家桶联合灾备包">💾 备份</button>
          <button type="button" class="lv-pop-sub-btn lv-pop-restore-btn" title="从备份文件恢复小驴全家桶数据（会覆盖当前数据）">♻ 恢复</button>
          <button type="button" class="lv-pop-sub-btn lv-pop-dedup-btn" title="全生态同步对账与多端重复内容治理 (快捷键 D)">🧹 对账</button>
        </div>
      </div>
      <div class="lv-pop-community-bar" style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:5px 12px 7px;border-top:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));background:color-mix(in srgb, var(--lv-lp-card-bg,#ffffff) 88%, var(--lv-lp-accent-soft,rgba(37,99,235,0.06)));border-radius:0 0 18px 18px;flex-shrink:0;font-size:11px;color:var(--lv-lp-text-sub,#64748b);">
        <div style="display:flex;align-items:center;gap:5px;white-space:nowrap;flex-shrink:0;">
          <span style="font-size:12px;">💬</span>
          <span>QQ 群 <strong style="color:var(--lv-lp-text,#0f172a);font-family:var(--lv-font-mono,monospace);font-weight:700;">${Je}</strong></span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
          <button type="button" class="lv-pop-sub-btn lv-pop-sponsor-btn" style="background:rgba(234, 179, 8, 0.12);color:#b45309;border:1px solid rgba(234, 179, 8, 0.35);border-radius:999px;padding:2px 10px;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:3px;cursor:pointer;transition:transform 0.12s ease, background 0.15s ease;" title="为小驴投喂 Token 算力，支持生态持续进化">
            <span>⚡ 投喂 Token</span>
          </button>
          <button type="button" class="lv-pop-sub-btn lv-pop-join-qq-btn" style="background:var(--lv-lp-accent,#2563eb);color:#ffffff;border:none;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:4px;cursor:pointer;transition:transform 0.12s ease, background 0.15s ease;" title="点击一键唤起 QQ 客户端申请加群，并自动复制群号 ${Je} 到剪贴板">
            <span>🚀 一键加群</span>
          </button>
        </div>
      </div>
    `,F=l?L:c?y:pe+A+de+K+b+ge;return f+F+G}function Ha(t,e,n=!1,o=!1,r="all"){if(typeof C>"u")return;let l=()=>Io(t,e,n,o,r);try{l()}catch(c){console.error("[LvLaunchpad] 弹射坞打开异常，尝试自愈重试:",c),Se(!0);try{l()}catch(i){console.error("[LvLaunchpad] 弹射坞自愈重试仍失败:",i);try{N.capsule({source:"罗盘",message:"罗盘弹射坞打开异常，请按 Ctrl+Shift+I 查看控制台 [LvLaunchpad] 日志",duration:4e3,level:"error",archive:!1})}catch{}}}}function Io(t,e,n=!1,o=!1,r="all"){if(typeof C>"u")return;Se(!0),po();let l=t||C.getElementById(Vo),c=Ne().getItems(),i=c.filter(s=>s.state!=="hidden");if(i.length===0&&c.length===0)return;co(!0),Zo();let a=C.createElement("div");a.id=Qo,a.className="lv-desktop-launchpad-popover b3-typography",a.setAttribute("role","dialog"),a.setAttribute("aria-modal","false"),a.setAttribute("aria-label","小驴罗盘全家桶弹射坞"),"tabIndex"in a&&(a.tabIndex=-1);let d=Et(),p=()=>{if(d.lvPopoverPressDepth>0&&d.lvPopoverPressDepth--,d.lvPopoverPressDepth===0&&d.lvPopoverDeferredSwap){let s=d.lvPopoverDeferredSwap;d.lvPopoverDeferredSwap=null;try{s()}catch{}}};a.addEventListener("pointerdown",()=>{d.lvPopoverPressDepth++;let s=!1,I=()=>{if(s)return;s=!0,typeof q<"u"&&typeof q.removeEventListener=="function"&&(q.removeEventListener("pointerup",I,!0),q.removeEventListener("pointercancel",I,!0)),a.removeEventListener("pointerup",I,!0),a.removeEventListener("pointercancel",I,!0);let k=d.lvPopoverPressCleanups.indexOf(B);k>=0&&d.lvPopoverPressCleanups.splice(k,1),p()},B=()=>{s=!0,typeof q<"u"&&typeof q.removeEventListener=="function"&&(q.removeEventListener("pointerup",I,!0),q.removeEventListener("pointercancel",I,!0)),a.removeEventListener("pointerup",I,!0),a.removeEventListener("pointercancel",I,!0)};d.lvPopoverPressCleanups.push(B),a.addEventListener("pointerup",I,{once:!0,capture:!0}),a.addEventListener("pointercancel",I,{once:!0,capture:!0}),typeof q<"u"&&typeof q.addEventListener=="function"&&(q.addEventListener("pointerup",I,{once:!0,capture:!0}),q.addEventListener("pointercancel",I,{once:!0,capture:!0}))},!0);let g=i.length>=3?520:440,h=()=>{if(!(!a||!a.style))try{let s=typeof q<"u"&&typeof q.innerWidth=="number"&&q.innerWidth>0?q.innerWidth:1200,I=typeof q<"u"&&typeof q.innerHeight=="number"&&q.innerHeight>0?q.innerHeight:800,B=Math.min(g,Math.max(280,s-24));if(a.style.width=`${B}px`,a.style.position="fixed",l&&typeof l.getBoundingClientRect=="function"){let k=l.getBoundingClientRect();if(k&&typeof k.bottom=="number"&&k.bottom>0){a.style.top=`${Math.round(k.bottom+6)}px`;let $=Math.max(12,s-B-12),O=Math.round(s-(k.right||0)-8),Z=Math.max(12,Math.min(O,$));a.style.right=`${Z}px`;let m=Math.max(180,Math.min(I-k.bottom-16,I-24));a.style.maxHeight=`${m}px`}else a.style.top="42px",a.style.right="16px",a.style.maxHeight=`${Math.max(180,I-58)}px`}else a.style.top="42px",a.style.right="16px",a.style.maxHeight=`${Math.max(180,I-58)}px`;try{let k=typeof q<"u"&&q.siyuan?.zIndex;a.style.zIndex=String(typeof k=="number"?Math.max(300,k+20):300)}catch{a.style.zIndex="300"}}catch{}};h(),a.style&&(a.style.display="flex",a.style.flexDirection="column",a.style.borderRadius="18px",a.style.overflow="hidden");let T=Jo(),E=ea(),S=n,P=o,j=r,D=Math.max(0,Math.min(e??0,Math.max(0,i.length-1))),f=!1,L=[],y=0,A=0,Q=null,re=!1,fe=null,ne=[];i.forEach(s=>{if(typeof s.badgeProvider=="function")try{let I=s.badgeProvider();I instanceof Promise?ne.push({item:s,promise:I}):I&&typeof I=="string"?s.badge=I:s.badge=void 0}catch{}});let Y=i.length>0&&i.every(s=>s.state==="pinned"),pe=(s="✓ 已保存")=>{if(typeof a.querySelector!="function")return;let I=a.querySelector(".lv-pop-save-toast");if(I){if(I.textContent=s,I.classList?.add?.("visible"),fe!==null)try{Oe(fe)}catch{}fe=Number((typeof q<"u"?q.setTimeout:Pe)(()=>{fe=null;try{I.classList?.remove?.("visible")}catch{}},1600))}},U=()=>{if(!S||typeof a.querySelector!="function")return;let s=a.querySelector(".lv-pop-notebook-select");if(!s)return;let I=s.getAttribute("data-selected-nb")||"";lt().then(B=>{if(!s.isConnected||!B.length)return;let k='<option value="">✨ 自动识别默认日记本</option>'+B.map($=>`<option value="${v($.id)}" ${$.id===I?"selected":""}>📔 ${v($.name)}</option>`).join("");s.innerHTML=k}).catch(()=>{})},de=()=>{let s=typeof q<"u"&&q.loadAiRouterConfig||null,I=typeof q<"u"&&q.saveAiRouterConfig||null,B=typeof q<"u"&&q.saveTier2SecretToHost||null;if(typeof s=="function"&&typeof I=="function"){let k=s(),$=a.querySelector(".lv-ai-pref-provider-select")?.value||"auto",O=a.querySelector(".lv-ai-custom-url-input")?.value.trim()||void 0,Z=a.querySelector(".lv-ai-custom-key-input"),m=Z?.value.trim()||"",u=a.querySelector(".lv-ai-custom-model-input")?.value.trim()||void 0,w=a.querySelector(".lv-ai-ollama-url-input")?.value.trim()||void 0,x=!!a.querySelector(".lv-ai-public-free-toggle")?.checked;m&&(typeof B=="function"?Promise.resolve(B(m)):Kn(m)).then(W=>{if(W?.ok){try{if(typeof We<"u"){let te=We.getItem("lv_ai_router_config_v1");if(te){let ye=JSON.parse(te);ye?.userCustom&&"apiKey"in ye.userCustom&&(delete ye.userCustom.apiKey,ye.userCustom.hasSecret=!0,We.setItem("lv_ai_router_config_v1",JSON.stringify(ye)))}}}catch{}let ce=s();ce?.userCustom&&delete ce.userCustom.apiKey,ce.userCustom={...ce.userCustom||{},hasSecret:!0,secretSlot:"lv_ai_secret_tier2_apikey"},I(ce),Z&&(Z.value="",Z.placeholder="•••••••• (已安全存入思源密钥库，留空保持不变)",Z.setAttribute("data-has-secret","true"))}}).catch(()=>{});let M=!!(typeof q<"u"&&q.hasTier2SecretConfigured?.());k.preferredProvider=$==="auto"?void 0:$,k.userCustom={...k.userCustom||{},baseUrl:O,model:u,hasSecret:M,secretSlot:"lv_ai_secret_tier2_apikey"},delete k.userCustom.apiKey,k.ollama={...k.ollama||{},baseUrl:w||"http://127.0.0.1:11434"},k.publicFree={...k.publicFree||{},enabled:x},I(k),pe("✓ AI 调度配置已更新")}},J=()=>{if(!S||typeof a.querySelector!="function")return;let s=H.getAiHubUi?.();if(s&&typeof s.attachAiHubEventListeners=="function"){s.attachAiHubEventListeners(a,de,pe);return}typeof H.loadAiHubUi=="function"&&H.loadAiHubUi().then(I=>{if(!I||!a.isConnected||!S)return;let B=a.querySelector(".lv-pop-ai-hub-slot");if(B){let k=typeof q<"u"&&q.loadAiRouterConfig?q.loadAiRouterConfig():{enableSiyuan:!0,enableRuleFallback:!0,publicFree:{enabled:!1},ollama:{enabled:!0,baseUrl:"http://127.0.0.1:11434"}},$=k.preferredProvider||"auto";B.innerHTML=`${I.buildAiWaterfallFlowchartHtml($)}
${I.buildAiTierCardsHtml(k,!0)}`}I.attachAiHubEventListeners?.(a,de,pe)}).catch(()=>{let I=a.querySelector(".lv-pop-ai-hub-loading");I&&(I.textContent="⚠️ 暂无法加载 AI 调度中枢，请稍后重试。")})},le=()=>{if(typeof a.querySelector=="function")try{let s=a.querySelector(".lv-pop-today-ticker");if(s&&s.parentNode){let I=C.createElement("div");I.innerHTML=So(vn(i));let B=I.firstElementChild;B&&Qn(()=>{try{s.isConnected&&B.isConnected===!1&&s.parentNode&&s.parentNode.replaceChild(B,s)}catch{}})}}catch{}},b=()=>{if(typeof a.querySelector=="function")try{let s=a.querySelector(".lv-pop-actions-drawer");s&&(s.innerHTML=To(i[D],E))}catch{}},K=()=>{if(typeof a.querySelectorAll=="function")try{a.querySelectorAll(".lv-pop-tile").forEach((I,B)=>{if(B===D){if(I.classList&&typeof I.classList.add=="function"&&I.classList.add("lv-pop-tile-focused"),typeof I.scrollIntoView=="function")try{I.scrollIntoView({block:"nearest"})}catch{}}else I.classList&&typeof I.classList.remove=="function"&&I.classList.remove("lv-pop-tile-focused")}),b()}catch{}},ue=()=>{let s=typeof a.querySelector=="function"?a.querySelector(".lv-pop-actions-drawer"):null;s?.addEventListener("mouseenter",()=>{re=!0}),s?.addEventListener("mouseleave",()=>{re=!1})},ge=()=>{if(typeof a.querySelector!="function")return;let s=a.querySelector(".lv-pop-search-input"),I=a.querySelector(".lv-pop-search-clear"),B=a.querySelector(".lv-pop-search-bar .lv-pop-kbd"),k=a.querySelector(".lv-pop-search-history"),$=a.querySelector(".lv-pop-omni-results"),O=a.querySelector(".lv-pop-grid, .lv-pop-list");if(!s||!$)return;let Z=()=>{if(!k)return;let m=Zn();if(!m.length||s.value.trim()){k.classList?.remove?.("visible"),k.innerHTML="";return}k.innerHTML='<span class="lv-pop-strip-label">最近:</span>'+m.slice(0,5).map(u=>`<button type="button" class="lv-pop-strip-chip lv-pop-hist-chip" data-kw="${v(u)}">${v(u)}</button>`).join(""),k.classList?.add?.("visible")};s.addEventListener("focus",()=>{s.value.trim()||Z()}),s.addEventListener("blur",()=>{(typeof q<"u"?q.setTimeout:Pe)(()=>{try{k?.classList?.remove?.("visible")}catch{}},160)}),I?.addEventListener("click",m=>{m.stopPropagation(),s.value="",s.dispatchEvent(new Re("input")),s.focus()}),k?.addEventListener("click",m=>{let u=m.target?.closest(".lv-pop-hist-chip");if(!u)return;m.stopPropagation();let w=u.getAttribute("data-kw")||"";w&&(s.value=w,s.dispatchEvent(new Re("input")),s.focus())}),s.addEventListener("input",()=>{let m=s.value.trim().toLowerCase(),u=++A;if(Q!==null){try{Oe(Q)}catch{}Q=null}if(I&&I.classList?.toggle?.("visible",!!m),B&&(B.textContent=m?"↵":"/"),!m){f=!1,L=[],$.style.display="none",O&&(O.style.display=T==="list"?"flex":"grid"),b(),C.activeElement===s&&Z();return}k?.classList?.remove?.("visible"),f=!0,O&&(O.style.display="none"),$.style.display="flex";let w=i.filter(_=>_.name.toLowerCase().includes(m)||_.fullName&&_.fullName.toLowerCase().includes(m)||_.desc&&_.desc.toLowerCase().includes(m)),x=[];i.forEach(_=>{(_.actions||[]).forEach(W=>{W.toLowerCase().includes(m)&&x.push({plugin:_,action:W})})});let M=(_,W)=>{if(u!==A||typeof a.isConnected=="boolean"&&!a.isConnected)return;L=[];let ce="";if(/^(查重|对账|冲突|排重|dup|dedup)/i.test(m.trim())){let V=L.length;L.push({label:"全思源文档查重与对账治理",onSelect:()=>{pn(m),Se(),kt()}}),ce+=`
                      <button type="button" class="lv-pop-hit-item ${V===y?"focused":""}" data-omni-idx="${V}">
                        <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                          <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;background:rgba(239,68,68,0.12);color:var(--b3-theme-error,#ef4444);flex-shrink:0;">🧹 治理</span>
                          <span style="font-size:12.5px;font-weight:700;color:var(--lv-lp-accent,#2563eb);white-space:nowrap;">全思源文档查重与对账治理工作室</span>
                          <span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">同名文档 · 段落去重 · 同步冲突与日记排重</span>
                        </div>
                        <span style="font-size:10.5px;font-weight:600;color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">打开 ➔</span>
                      </button>
                    `}if(w.forEach(V=>{let xe=L.length,Ie=nt(V.id,V.color);L.push({label:V.fullName||V.name,onSelect:()=>{Ve(V.id),Se();try{V.onClick()}catch{}}}),ce+=`
                      <button type="button" class="lv-pop-hit-item ${xe===y?"focused":""}" data-omni-idx="${xe}">
                        <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                          <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:${Ie};flex-shrink:0;">插件</span>
                          <span style="font-size:12.5px;font-weight:600;color:var(--lv-lp-text,#0f172a);white-space:nowrap;">${v(V.fullName||V.name)}</span>
                          <span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v(V.desc||"")}</span>
                        </div>
                        <span style="font-size:10.5px;font-weight:600;color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">启动 ➔</span>
                      </button>
                    `}),x.slice(0,5).forEach(({plugin:V,action:xe})=>{let Ie=L.length;L.push({label:xe,onSelect:()=>{Ve(V.id),Se();try{Ne().executeAction(V.id,xe)}catch{}}}),ce+=`
                      <button type="button" class="lv-pop-hit-item ${Ie===y?"focused":""}" data-omni-idx="${Ie}">
                        <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                          <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;background:rgba(16,185,129,0.14);color:var(--b3-theme-success,#059669);flex-shrink:0;">⚡ ${v(V.name)}</span>
                          <span style="font-size:12.5px;font-weight:600;color:var(--lv-lp-text,var(--b3-theme-on-background,#0f172a));overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v(xe)}</span>
                        </div>
                        <span style="font-size:10.5px;font-weight:600;color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">执行 ➔</span>
                      </button>
                    `}),_.slice(0,12).forEach(V=>{let xe=L.length;L.push({label:V.title,onSelect:()=>{pn(m),Se(),ho(V)}}),ce+=`
                      <button type="button" class="lv-pop-hit-item ${xe===y?"focused":""}" data-omni-idx="${xe}">
                        <div style="display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden;">
                          <span style="font-size:10px;font-weight:600;padding:1px 6px;border-radius:4px;background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">${v(V.source||V.badge||"小驴")}</span>
                          <span style="font-size:12.5px;font-weight:600;color:var(--lv-lp-text,#0f172a);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v(V.title)}</span>
                          ${V.snippet?`<span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v(V.snippet)}</span>`:""}
                        </div>
                        <span style="font-size:10.5px;font-weight:600;color:var(--lv-lp-accent,#2563eb);flex-shrink:0;">直达 ➔</span>
                      </button>
                    `}),y>=L.length&&(y=Math.max(0,L.length-1)),!W.done)ce+=`<div style="text-align:center;padding:6px 12px;font-size:11px;color:var(--lv-lp-text-sub,#64748b);">🔍 正在流式检索全生态知识库 (${W.pending} 项进行中)…</div>`;else if(L.length===0){let V=s.value.trim();ce=`
                      <div style="text-align:center;padding:22px 16px 12px;font-size:12px;color:var(--lv-lp-text-sub,#64748b);">
                        未在小驴全家桶中穿透检索到与 “<strong style="color:var(--lv-lp-text,#0f172a);">${v(V)}</strong>” 相关的条目
                      </div>
                      <div class="lv-pop-empty-actions" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:0 14px 18px;">
                        <button type="button" class="lv-pop-sub-btn lv-omni-empty-note-btn" data-search-kw="${v(V)}" style="padding:5px 12px;font-size:11.5px;font-weight:600;">⚡ 以此内容一键记事</button>
                        <button type="button" class="lv-pop-sub-btn lv-omni-empty-task-btn" data-search-kw="${v(V)}" style="padding:5px 12px;font-size:11.5px;font-weight:600;">✅ 以此标题新建待办</button>
                      </div>
                    `}$.innerHTML=ce;let ye=a.querySelector(".lv-pop-actions-title");ye&&(ye.textContent=W.done?`🔍 全生态万物穿透检索 · 命中 ${L.length} 条 (↑↓ 选择 · ↵ 直达)`:`🔍 正在流式检索… 已命中 ${L.length} 条`)};y=0,M([],{done:!1,pending:1,total:1}),Q=Number((typeof q<"u"?q.setTimeout:Pe)(()=>{Q=null,u===A&&(typeof a.isConnected=="boolean"&&!a.isConnected||ro.searchStream(m,(_,W)=>{M(_,W)}).catch(()=>{}))},85))})},z=s=>{let I=[];if(s?.preserveScroll&&typeof a.querySelector=="function")for(let B of[".lv-pop-grid",".lv-pop-list",".lv-pop-pref-drawer",".lv-pop-inbox-drawer"]){let k=a.querySelector(B);k&&k.scrollTop>0&&I.push({sel:B,top:k.scrollTop})}if(s?.refreshItems){let B=new Map(i.map(k=>[k.id,k.badge]));c=Ne().getItems(),i=c.filter(k=>k.state!=="hidden"),i.forEach(k=>{let $=B.get(k.id);$&&!k.badge&&(k.badge=$)}),Y=i.length>0&&i.every(k=>k.state==="pinned"),D=Math.max(0,Math.min(D,Math.max(0,i.length-1)))}if(f=!1,L=[],re=!1,a.classList?.add?.("lv-popover-settled"),Qn(()=>{a.innerHTML=Sn(i,Y,{view:T,focusedIndex:D,showPrefDrawer:S,showInboxDrawer:P,inboxFilter:j,actionLimit:E,allItems:c})}),K(),ge(),ue(),U(),J(),I.length&&typeof a.querySelector=="function")for(let{sel:B,top:k}of I){let $=a.querySelector(B);$&&($.scrollTop=k)}};if(a.innerHTML=Sn(i,Y,{view:T,focusedIndex:D,showPrefDrawer:S,showInboxDrawer:P,inboxFilter:j,actionLimit:E,allItems:c}),K(),ge(),ue(),U(),J(),ne.forEach(({item:s,promise:I})=>{I.then(B=>{if(B&&typeof B=="string"){if(s.badge=B,typeof a.querySelector=="function"){let k=a.querySelector(`[data-id="${s.id}"]`);if(k){let $=k.querySelector(".lv-pop-badge");$||($=C.createElement("span"),$.className=`lv-pop-badge ${s.badgeType?`lv-badge-${s.badgeType}`:"lv-badge-primary"}`,k.appendChild($)),$.textContent=B}le()}Ye()}else!B&&s.badge&&(s.badge=void 0,typeof a.querySelector=="function"&&(a.querySelector(`[data-id="${s.id}"]`)?.querySelector(".lv-pop-badge")?.remove(),le()),Ye())}).catch(()=>{})}),typeof a.addEventListener=="function"){a.addEventListener("change",k=>{let $=k.target;if(!$||typeof $.closest!="function")return;let O=$.closest(".lv-pop-state-select");if(O){let te=O.getAttribute("data-state-id"),ye=O.value;te&&(ye==="pinned"||ye==="docked"||ye==="hidden")&&(Ne().setPluginState(te,ye),pt(),z({preserveScroll:!0,refreshItems:!0}),pe("✓ 图标状态已更新"));return}let Z=$.closest(".lv-pop-rule-toggle");if(Z){let te=Z.getAttribute("data-rule-id");te&&(Kt.toggleRule(te,!!Z.checked),pe(Z.checked?"✓ 规则已启用":"✓ 规则已停用"));return}let m=$.closest(".lv-pop-mobile-mode-select");if(m){let te=m.value;(te==="both"||te==="ball"||te==="topbar"||te==="none")&&(dn(te),pe("✓ 入口形态已保存"));return}let u=$.closest(".lv-pop-lifelog-cats-input");if(u){let te=u.value.split(/[,，]/).map(ye=>ye.trim()).filter(Boolean);te.length>0&&(ze({lifeLogCategories:te}),pe("✓ 分类已保存"));return}let w=$.closest(".lv-pop-notebook-select");if(w){let te=w.value.trim();ze({lifeLogNotebookId:te||void 0,diaryNotebookId:te||void 0,quickNoteNotebookId:te||void 0}),te&&lt().then(ye=>{let V=ye.find(Ie=>Ie.id===te),xe=w.selectedOptions?.[0];V&&xe&&(xe.textContent=`📔 ${V.name}`)}).catch(()=>{}),pe("✓ 日记本已保存");return}let x=$.closest(".lv-ai-pref-provider-select"),M=$.closest(".lv-ai-custom-url-input"),_=$.closest(".lv-ai-custom-key-input"),W=$.closest(".lv-ai-custom-model-input"),ce=$.closest(".lv-ai-ollama-url-input");if(x||M||_||W||ce){de();return}}),a.addEventListener("click",k=>{let $=k.target;if(!$||typeof $.closest!="function")return;if($.closest(".lv-pop-restore-hidden-btn")){k.stopPropagation(),Vn(),z({preserveScroll:!1,refreshItems:!0}),pe("✓ 已恢复显示全部隐藏插件");return}let Z=$.closest(".lv-pop-order-up-btn");if(Z){k.stopPropagation();let X=Z.getAttribute("data-order-id");X&&Ne().movePluginOrder?.(X,"up")&&(z({preserveScroll:!0,refreshItems:!0}),pe("✓ 磁贴已上移"));return}let m=$.closest(".lv-pop-order-down-btn");if(m){k.stopPropagation();let X=m.getAttribute("data-order-id");X&&Ne().movePluginOrder?.(X,"down")&&(z({preserveScroll:!0,refreshItems:!0}),pe("✓ 磁贴已下移"));return}if($.closest(".lv-pop-reset-order-btn")){k.stopPropagation(),Ne().resetPluginOrder?.(),z({preserveScroll:!0,refreshItems:!0}),pe("✓ 已恢复默认顺序");return}if($.closest(".lv-test-ai-btn")){k.stopPropagation();let X=a.querySelector(".lv-ai-test-badge");X&&(X.textContent="⏳ 测速中...",X.style.color="var(--lv-lp-accent,#2563eb)");let he=q.getSharedAiRouter?q.getSharedAiRouter():null;if(!he){X&&(X.textContent="未检测到调度中枢",X.style.color="#ef4444");return}he.chat({messages:[{role:"user",content:"ping"}],taskType:"chat",timeoutMs:6e3}).then(we=>{if(X)if(we.ok){let Ke=we.provider==="siyuan"?"思源智能体":we.provider==="user_custom"?"自定义Key":we.provider==="ollama"?"本地Ollama":we.provider==="public_free"?"免费公用池":"离线规则";X.textContent=`✓ ${Ke} (${we.latencyMs}ms)`,X.style.color="#10b981"}else X.textContent=`✗ 测试失败: ${we.error||"超时"}`,X.style.color="#ef4444"}).catch(we=>{X&&(X.textContent=`✗ 异常: ${we?.message||String(we)}`,X.style.color="#ef4444")});return}if($.closest(".lv-quick-note-btn")){k.stopPropagation(),Xe();return}if($.closest(".lv-quick-lifelog-btn")){k.stopPropagation(),Nt();return}let _=$.closest(".lv-quick-clip-btn");if(_){k.stopPropagation(),_.setAttribute("data-busy","true"),en().finally(()=>{try{_.removeAttribute("data-busy")}catch{}});return}let W=$.closest(".lv-quick-diary-bottom-btn");if(W){k.stopPropagation(),W.setAttribute("data-busy","true"),ot().finally(()=>{try{W.removeAttribute("data-busy")}catch{}});return}if($.closest(".lv-quick-task-mgr-btn")){k.stopPropagation(),Zt();return}let te=$.closest(".lv-quick-new-task-btn");if(te){k.stopPropagation(),te.setAttribute("data-busy","true"),Jt().finally(()=>{try{te.removeAttribute("data-busy")}catch{}});return}let ye=$.closest(".lv-quick-random-walk-btn");if(ye){k.stopPropagation(),ye.setAttribute("data-busy","true"),Ht().finally(()=>{try{ye.removeAttribute("data-busy")}catch{}});return}let V=$.closest(".lv-quick-reload-btn");if(V){k.stopPropagation(),V.setAttribute("data-busy","true"),Cn().finally(()=>{try{V.removeAttribute("data-busy")}catch{}});return}let xe=$.closest(".lv-inbox-filter-btn");if(xe){k.stopPropagation();let X=xe.getAttribute("data-inbox-filter");(X==="all"||X==="unread"||X==="alert"||X==="siyuan")&&(j=X,z({preserveScroll:!0}));return}let Ie=$.closest(".lv-pop-view-tab[data-view]");if(Ie){k.stopPropagation();let X=Ie.getAttribute("data-view")==="list"?"list":"grid";X!==T&&(T=X,Xo(X),z());return}if($.closest(".lv-pop-focus-btn")){if(k.stopPropagation(),bt())an(),N.capsule({source:"罗盘",message:"已退出全局专注模式",duration:2e3,archive:!1});else{let X=new ae,he=new ae(X);he.setHours(23,0,0,0),he.getTime()<=X.getTime()&&he.setTime(X.getTime()+2*36e5),on(he.getTime()),N.capsule({source:"罗盘",message:`已开启专注模式至 ${he.toTimeString().slice(0,5)}`,duration:2500,archive:!1})}Ye(),z({preserveScroll:!0});return}if($.closest(".lv-pop-inbox-btn")){k.stopPropagation(),P=!P,P&&(S=!1),z();return}if($.closest(".lv-inbox-mark-all-btn")){k.stopPropagation(),N.markAllRead(),Ye(),z({preserveScroll:!0}),N.capsule({source:"通知中心",message:"✓ 已全部标为已读",duration:1600,archive:!1});return}if($.closest(".lv-inbox-clear-btn")){k.stopPropagation(),N.clearHistory(),Ye(),z(),N.capsule({source:"通知中心",message:"✓ 已清空通知历史",duration:1600,archive:!1});return}let be=$.closest(".lv-inbox-diag-btn");if(be){k.stopPropagation();let X=be.textContent||"🩺 诊断";be.textContent="…收集",(async()=>{try{let he=await Rt.buildDiagnosticReport(),we=await qt(he);be.textContent=we?"✓ 已复制":"✗ 复制失败",N.capsule({source:"通知中心",message:we?`🩺 诊断报告已复制，请发 QQ 群 ${Je} 或邮箱 ${Pt}`:`🩺 报告复制失败，请截图发 QQ 群 ${Je}`,duration:3e3,archive:!1})}catch(he){be.textContent="✗ 复制失败",N.capsule({source:"通知中心",message:`🩺 诊断报告生成失败：${he instanceof Error?he.message:"未知错误"}（可截图反馈至 QQ 群 ${Je}）`,duration:3e3,archive:!1})}finally{Pe(()=>{try{be.textContent=X}catch{}},1800)}})();return}let De=$.closest(".lv-inbox-copy-btn");if(De){k.stopPropagation();let X=De.getAttribute("data-inbox-id"),he=N.getHistory().find(we=>we.id===X);if(he){let we=`${he.source?`[${he.source}] `:""}${he.title?`${he.title}: `:""}${he.message||""}`.trim();qt(we).then(Ke=>{Ke&&(De.textContent="✓ 已复制",Pe(()=>{try{De.textContent="复制"}catch{}},1200))})}return}let Ee=$.closest(".lv-inbox-action-btn");if(Ee){k.stopPropagation();let X=Ee.getAttribute("data-inbox-id");X&&N.markRead(X);let he=N.getHistory().find(we=>we.id===X);if(he&&he.action?.onClick){Se();try{he.action.onClick()}catch(we){console.warn("[LvNotify] 通知行动执行失败:",we)}}return}let Me=$.closest(".lv-inbox-item.unread");if(Me){k.stopPropagation();let X=Me.getAttribute("data-inbox-id");X&&(N.markRead(X),Ye(),z({preserveScroll:!0}));return}if($.closest(".lv-pop-pref-btn")){k.stopPropagation(),Se(),Rn();return}let ee=$.closest(".lv-pop-unmute-btn");if(ee){k.stopPropagation();let X=ee.getAttribute("data-unmute-cat");X&&(N.clearCategoryMute(X),N.capsule({source:"免打扰",message:`已恢复「${X}」的正常通知提醒`,duration:2e3,archive:!1}),z({preserveScroll:!0}),pe("✓ 已解除静音"));return}if($.closest(".lv-pop-actions-limit-btn")){k.stopPropagation(),E=E==="all"?3:"all",ta(E),b();return}let ve=$.closest(".lv-pop-action-row");if(ve){k.stopPropagation();let X=ve.getAttribute("data-action-plugin"),he=ve.getAttribute("data-action-name");if(X&&he){Ve(X),Se();try{Ne().executeAction(X,he)}catch(we){console.warn("[LvLaunchpad] 二级行动失败:",we)}}return}let qe=$.closest(".lv-omni-empty-note-btn");if(qe){k.stopPropagation();let X=qe.getAttribute("data-search-kw")||"";Se(),Xe(X);return}let Le=$.closest(".lv-omni-empty-task-btn");if(Le){k.stopPropagation();let X=Le.getAttribute("data-search-kw")||"";Se(),Xe("- [ ] "+X);return}let Ce=$.closest(".lv-pop-hit-item");if(Ce){k.stopPropagation();let X=parseInt(Ce.getAttribute("data-omni-idx")||"0",10),he=L[X];he&&he.onSelect();return}let _e=$.closest(".lv-pop-strip-chip:not(.lv-pop-hist-chip), .lv-pop-today-card, .lv-pop-ticker-pill");if(_e){k.stopPropagation();let X=_e.getAttribute("data-recent-id"),he=i.find(we=>we.id===X);if(he){Ve(he.id),Se();try{he.onClick()}catch(we){console.warn("[LvLaunchpad] 快捷启动失败:",we)}}return}let ct=$.closest(".lv-pop-diary-btn");if(ct){k.stopPropagation(),ct.setAttribute("data-busy","true"),mn().finally(()=>{try{ct.removeAttribute("data-busy")}catch{}Se()});return}let Lt=$.closest(".lv-pop-backup-btn");if(Lt){k.stopPropagation(),Lt.setAttribute("data-busy","true"),N.capsule({source:"罗盘",message:"💾 正在打包小驴全家桶联合备份…",duration:2200,archive:!1}),(async()=>{try{let X=await rn.exportFull(),he=new Blob([JSON.stringify(X,null,2)],{type:"application/json;charset=utf-8"}),we=URL.createObjectURL(he),Ke=C.createElement("a");Ke.href=we,Ke.download=`xiaolv-ecosystem-backup-${dt()}.json`,C.body.appendChild(Ke),Ke.click(),Ke.remove(),Pe(()=>URL.revokeObjectURL(we),1e3);let Bt=X.failed?.length??0;N.capsule({source:"罗盘",message:Bt>0?`已发起部分备份下载：${Object.keys(X.plugins).length} 项成功，${Bt} 项失败；详见备份清单`:"💾 已发起小驴联合备份下载，请核对下载文件",duration:4e3,level:Bt>0?"warn":"success"})}catch{N.card({source:"罗盘",level:"error",message:"备份导出失败，尚未生成可下载文件，请重试",duration:5e3})}finally{try{Lt.removeAttribute("data-busy")}catch{}Se()}})();return}if($.closest(".lv-pop-restore-btn")){k.stopPropagation(),Nn();return}if($.closest(".lv-pop-store-btn")){k.stopPropagation(),Se(),je.openStoreDialog();return}if($.closest(".lv-pop-dedup-btn")){k.stopPropagation(),kt();return}if($.closest(".lv-pop-sponsor-btn")){k.stopPropagation(),Se(),_n();return}if($.closest(".lv-pop-join-qq-btn")){k.stopPropagation(),Wn();return}if($.closest(".lv-pop-toggle-all-btn")){k.stopPropagation();let X=Y?"docked":"pinned";for(let we of i)Ne().setPluginState(we.id,X);pt(),z({preserveScroll:!0,refreshItems:!0});let he=Math.max(0,(c?.length||0)-i.length);N.capsule({source:"罗盘",message:X==="pinned"?he>0?`📌 已将可见插件平铺至顶栏（${he} 个隐藏插件保持隐藏）`:"📌 已将全部插件平铺至顶栏":"🧭 已将插件收敛回小驴罗盘",duration:1800,archive:!1});return}let Bo=$.closest(".lv-pop-pin-btn");if(Bo){k.stopPropagation();let X=Bo.getAttribute("data-pin-id");if(X){let we=(Yn()[X]||"docked")==="pinned"?"docked":"pinned";Ne().setPluginState(X,we),pt(),z({preserveScroll:!0,refreshItems:!0});let Ke=i.find(Bt=>Bt.id===X);N.capsule({source:"罗盘",message:we==="pinned"?`📌 已置顶「${Ke?.name||X}」到顶栏`:`📥 已将「${Ke?.name||X}」收敛至罗盘`,duration:1600,archive:!1})}return}if($.closest(".lv-pop-close-btn")){k.stopPropagation(),Se();return}let Po=$.closest(".lv-pop-tile");if(Po){let X=Po.getAttribute("data-idx");if(X!==null){let he=parseInt(X,10),we=i[he];if(we){Ve(we.id),Se();try{we.onClick()}catch(Ke){console.warn("[LvLaunchpad] 启动失败:",Ke)}}}}});let s=null,I=-1,B=()=>{if(s!==null){try{Oe(s)}catch{}s=null}I=-1};a.addEventListener("mousemove",k=>{if(re){B();return}let $=k.target;if(!$||typeof $.closest!="function")return;if($.closest(".lv-pop-actions-drawer")){B();return}let O=$.closest(".lv-pop-tile");if(O){let Z=O.getAttribute("data-idx");if(Z!==null){let m=parseInt(Z,10);if(m>=0&&m<i.length&&m!==D){if(I===m&&s!==null)return;B(),I=m;let u=typeof q<"u"&&typeof q.setTimeout=="function"?q.setTimeout.bind(q):Pe;s=Number(u(()=>{s=null,!re&&a.isConnected&&m!==D&&(D=m,K())},80))}else m===D&&B()}}else B()}),a.addEventListener("mouseleave",B),a.addEventListener("contextmenu",k=>{let O=k.target?.closest?.(".lv-pop-tile");if(O){k.preventDefault(),k.stopPropagation();let Z=O.getAttribute("data-idx");Z!==null&&(D=parseInt(Z,10),K(),re=!0)}})}let G=Et();if(G.desktopPopoverKeyDownHandler=s=>{if(!s||typeof s.key!="string"||s.isComposing||s.keyCode===229)return;if(s.key==="Escape"){if(s.defaultPrevented||Ge?.top?.())return;try{s.preventDefault(),s.stopPropagation()}catch{}if(f&&typeof a.querySelector=="function"){let m=a.querySelector(".lv-pop-search-input");if(m&&m.value){m.value="",m.dispatchEvent(new Re("input"));return}}if(S||P){S=!1,P=!1,z();return}Se();return}if(s.key==="Tab"){let m=Array.from(a.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')).filter(x=>x.offsetParent!==null||x===C.activeElement);if(m.length===0)return;try{s.preventDefault(),s.stopPropagation()}catch{}let u=m.indexOf(C.activeElement),w;u===-1?w=0:w=(u+(s.shiftKey?-1:1)+m.length)%m.length,m[w]?.focus();return}if(f){if(s.key==="ArrowDown"){try{s.preventDefault(),s.stopPropagation()}catch{}L.length>0&&(y=(y+1)%L.length,typeof a.querySelectorAll=="function"&&a.querySelectorAll(".lv-pop-hit-item").forEach((m,u)=>{let w=u===y;if(m.classList.toggle("focused",w),w)try{m.scrollIntoView?.({block:"nearest"})}catch{}}));return}if(s.key==="ArrowUp"){try{s.preventDefault(),s.stopPropagation()}catch{}L.length>0&&(y=(y-1+L.length)%L.length,typeof a.querySelectorAll=="function"&&a.querySelectorAll(".lv-pop-hit-item").forEach((m,u)=>{let w=u===y;if(m.classList.toggle("focused",w),w)try{m.scrollIntoView?.({block:"nearest"})}catch{}}));return}if(s.key==="Enter"){try{s.preventDefault(),s.stopPropagation()}catch{}let m=L[y];m&&m.onSelect();return}return}let I=typeof C<"u"?C.activeElement:null,B=I?.tagName?.toUpperCase(),k=!!(I&&(B==="INPUT"||B==="TEXTAREA"||B==="SELECT"||I.isContentEditable)),$=!!(I?.classList?.contains?.("lv-pop-search-input")&&I.value);if(!k&&s.key==="/"&&!S&&!P&&typeof a.querySelector=="function"){let m=a.querySelector(".lv-pop-search-input");if(m){try{s.preventDefault(),s.stopPropagation()}catch{}m.focus();return}}if(S||P)return;let O=T==="list"?1:i.length>=3?3:2;if(s.key==="ArrowDown"){try{s.preventDefault(),s.stopPropagation()}catch{}re=!1,D+O<i.length?D+=O:D+1<i.length&&(D+=1),K();return}if(s.key==="ArrowUp"){try{s.preventDefault(),s.stopPropagation()}catch{}re=!1,D-O>=0?D-=O:D-1>=0&&(D-=1),K();return}if(s.key==="ArrowRight"&&!$){try{s.preventDefault(),s.stopPropagation()}catch{}re=!1,i.length>0&&(D=(D+1)%i.length),K();return}if(s.key==="ArrowLeft"&&!$){try{s.preventDefault(),s.stopPropagation()}catch{}re=!1,i.length>0&&(D=(D-1+i.length)%i.length),K();return}if((s.key==="Enter"||s.key===" "&&!k)&&!$){try{s.preventDefault(),s.stopPropagation()}catch{}let m=i[D];if(m){Ve(m.id),Se();try{m.onClick()}catch(u){console.warn("[LvLaunchpad] 键盘启动失败:",u)}}return}if(!k&&(s.key==="p"||s.key==="P")){try{s.preventDefault(),s.stopPropagation()}catch{}let m=i[D];if(m){let w=(Yn()[m.id]||"docked")==="pinned"?"docked":"pinned";Ne().setPluginState(m.id,w),pt(),z({preserveScroll:!0,refreshItems:!0})}return}if(!k){if(s.key==="n"||s.key==="N"){try{s.preventDefault(),s.stopPropagation()}catch{}Xe();return}if(s.key==="l"||s.key==="L"){try{s.preventDefault(),s.stopPropagation()}catch{}Nt();return}if(s.key==="v"||s.key==="V"){try{s.preventDefault(),s.stopPropagation()}catch{}en();return}if(s.key==="b"||s.key==="B"){try{s.preventDefault(),s.stopPropagation()}catch{}ot();return}if(s.key==="t"||s.key==="T"){try{s.preventDefault(),s.stopPropagation()}catch{}Zt();return}if(s.key==="k"||s.key==="K"){try{s.preventDefault(),s.stopPropagation()}catch{}Jt();return}if(s.key==="w"||s.key==="W"){try{s.preventDefault(),s.stopPropagation()}catch{}Ht();return}if(s.key==="r"||s.key==="R"){try{s.preventDefault(),s.stopPropagation()}catch{}Cn();return}if(s.key==="d"||s.key==="D"){try{s.preventDefault(),s.stopPropagation()}catch{}kt();return}}let Z=parseInt(s.key,10);if(!k&&!isNaN(Z)&&Z>=1&&Z<=i.length){try{s.preventDefault(),s.stopPropagation()}catch{}let m=i[Z-1];if(m){Ve(m.id),Se();try{m.onClick()}catch(u){console.warn("[LvLaunchpad] 键盘瞬发失败:",u)}}return}},typeof q<"u"&&typeof q.addEventListener=="function"&&q.addEventListener("keydown",G.desktopPopoverKeyDownHandler,!0),G.desktopPopoverOutsideClickHandler=s=>{let I=s.target;typeof a.contains=="function"&&!a.contains(I)&&l&&typeof l.contains=="function"&&!l.contains(I)&&Se()},G.desktopPopoverOutsideBindTimer!==null){try{typeof q<"u"?q.clearTimeout(G.desktopPopoverOutsideBindTimer):Oe(G.desktopPopoverOutsideBindTimer)}catch{}G.desktopPopoverOutsideBindTimer=null}let F=typeof q<"u"?q.setTimeout:Pe;if(G.desktopPopoverOutsideBindTimer=Number(F(()=>{G.desktopPopoverOutsideBindTimer=null,!(!G.desktopPopoverOutsideClickHandler||!na())&&typeof q<"u"&&typeof q.addEventListener=="function"&&q.addEventListener("mousedown",G.desktopPopoverOutsideClickHandler,!0)},50)),G.desktopPopoverResizeHandler=h,typeof q<"u"&&typeof q.addEventListener=="function"&&q.addEventListener("resize",G.desktopPopoverResizeHandler),C.body&&typeof C.body.appendChild=="function"){C.body.appendChild(a);try{typeof q<"u"&&q.__LV_SYNC_NOTICE_AVOIDANCE__?.()}catch{}}}function za(t){if(typeof C>"u")return null;let e=C.createElement("div");e.className="lv-sheet-tile",e.setAttribute("role","button"),e.setAttribute("tabindex","0"),e.setAttribute("aria-label",t.fullName||t.name),e.setAttribute("aria-expanded","false");let n=Xn(t.svgIcon),o=t.color&&!t.color.startsWith("var(--lv-brand")?t.color:gn[t.id];if(o&&e.style&&typeof e.style.setProperty=="function")try{e.style.setProperty("--tile-brand",o)}catch{}if(n){let h=C.createElement("span");h.className="lv-sheet-tile-icon",o&&(h.style.color=o),h.innerHTML=`<svg aria-hidden="true" style="fill:none!important;stroke:currentColor!important;"><use xlink:href="${n}" href="${n}"></use></svg>`,e.appendChild(h)}else if(uo[t.id]){let h=C.createElement("span");h.className="lv-sheet-tile-icon",o&&(h.style.color=o),h.innerHTML=Wt(t.id,18),e.appendChild(h)}else{let h=C.createElement("span");h.className="lv-sheet-tile-dot",o&&(h.style.background=o),e.appendChild(h)}let r=C.createElement("span");r.className="lv-sheet-tile-name",r.textContent=t.fullName||t.name,e.appendChild(r);let l=C.createElement("span");if(l.className="lv-sheet-tile-desc",l.textContent=t.desc||"",e.appendChild(l),t.badge){let h=C.createElement("span");h.className="lv-sheet-tile-badge",t.badgeType==="success"?h.classList.add("lv-sheet-tile-badge--success"):(t.badgeType==="warn"||t.badgeType==="error")&&h.classList.add("lv-sheet-tile-badge--warn"),h.textContent=t.badge,e.appendChild(h)}let c=!1,i,a=()=>{i!==void 0&&(q.clearTimeout(i),i=void 0)},d=()=>{a(),i=q.setTimeout(()=>{c=!1,i=void 0},1500)};e.addEventListener("click",h=>{if(c){c=!1,a(),h.preventDefault(),h.stopPropagation();return}oe(8),Ve(t.id),$e(),_t();try{t.onClick()}catch(T){console.warn("[LvLaunchpad] 磁贴唤起失败:",T)}}),e.addEventListener("keydown",h=>{let T=h;T.target===e&&(T.key==="Enter"||T.key===" ")&&(T.preventDefault(),e.click())});let p=()=>{oe(14);let h=C.getElementById(at);if(!h)return;if(e.classList.contains("lv-sheet-tile--expanded")){e.classList.remove("lv-sheet-tile--expanded"),e.setAttribute("aria-expanded","false"),e.querySelectorAll(".lv-sheet-tile-actions").forEach(S=>S.remove());return}let T=Array.isArray(t.actions)?t.actions.filter(S=>typeof S=="string"&&S.trim()!==""):[];if(T.length===0)return;h.querySelectorAll(".lv-sheet-tile--expanded").forEach(S=>{S.classList.remove("lv-sheet-tile--expanded"),S.setAttribute("aria-expanded","false")}),e.classList.add("lv-sheet-tile--expanded"),e.setAttribute("aria-expanded","true"),h.querySelectorAll(".lv-sheet-tile-actions").forEach(S=>S.remove());let E=C.createElement("span");E.className="lv-sheet-tile-actions";for(let S of T){let P=C.createElement("button");P.type="button",P.className="lv-sheet-action-chip",P.textContent=S,P.addEventListener("click",j=>{j.stopPropagation(),oe(8),Ve(t.id),$e(),_t();try{Ne().executeAction(t.id,S)}catch(D){console.warn("[LvLaunchpad] 行动直达失败:",D)}}),E.appendChild(P)}e.appendChild(E)};e.addEventListener("contextmenu",h=>{h.preventDefault(),h.stopPropagation(),p()});let g;return e.addEventListener("touchstart",()=>{c=!1,a(),g!==void 0&&q.clearTimeout(g),g=q.setTimeout(()=>{g=void 0,c=!0,p()},500)},{passive:!0}),e.addEventListener("touchend",()=>{g!==void 0&&(q.clearTimeout(g),g=void 0),c&&d()},{passive:!0}),e.addEventListener("touchmove",()=>{g!==void 0&&(q.clearTimeout(g),g=void 0)},{passive:!0}),e.addEventListener("touchcancel",()=>{g!==void 0&&(q.clearTimeout(g),g=void 0),c&&d()},{passive:!0}),e}function Co(){if(typeof C>"u")return;let t=()=>Mo();try{t()}catch(e){console.error("[LvLaunchpad] 移动端弹射坞打开异常，尝试自愈重试:",e),$e(!0);try{t()}catch(n){console.error("[LvLaunchpad] 移动端弹射坞自愈重试仍失败:",n);try{N.capsule({source:"罗盘",message:"罗盘弹射坞打开异常，请查看控制台 [LvLaunchpad] 日志",duration:4e3,level:"error",archive:!1})}catch{}}}}function Mo(){if(typeof C>"u")return;let t=C.getElementById(at);if(t)if(t.classList.contains("lv-sheet-closing")){try{t.remove()}catch{}let u=Et();if(u.sheetCloseTimer!==void 0){try{q.clearTimeout(u.sheetCloseTimer)}catch{}u.sheetCloseTimer=void 0}}else return;fn(),co(!0);let e=C.createElement("div");e.id=at,e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true"),e.setAttribute("aria-label","小驴罗盘弹射坞"),e.setAttribute("data-prevent-swipe","true");let n=C.createElement("div");n.className="lv-sheet",n.setAttribute("data-prevent-swipe","true"),e.appendChild(n);let o=C.createElement("div");o.className="lv-sheet-handle",o.setAttribute("aria-hidden","true"),n.appendChild(o);let r=Ne().getItems(),l=r.filter(u=>u.state!=="hidden");l.sort((u,w)=>(u.state==="pinned"?0:1)-(w.state==="pinned"?0:1));let c=C.createElement("div");c.className="lv-sheet-head";let i=C.createElement("span");i.className="lv-sheet-title",i.textContent="🧭 小驴罗盘",c.appendChild(i);let a=C.createElement("div");a.className="lv-sheet-head-actions";let d=C.createElement("button");d.type="button",d.className="lv-sheet-moon",d.setAttribute("aria-label","专注模式开关");let p=()=>{let u=bt(),w=nn();d.textContent=u?`🌙 ${new ae(w).toTimeString().slice(0,5)}`:"🌙 专注",d.setAttribute("aria-pressed",String(u)),d.title=u?"点击退出专注模式":"开启专注模式（全生态静音至今晚）"};p(),d.addEventListener("click",()=>{if(bt())an(),oe(8),N.capsule({source:"罗盘",message:"已退出专注模式",duration:2e3,archive:!1});else{let u=new ae,w=new ae(u);w.setHours(23,0,0,0),w.getTime()<=u.getTime()&&w.setTime(u.getTime()+2*36e5),on(w.getTime()),oe(10),N.capsule({source:"罗盘",message:`已开启专注模式至 ${w.toTimeString().slice(0,5)}，通知将静音留档`,duration:2600,archive:!1})}p(),Ye()}),a.appendChild(d);let g=C.createElement("button");g.type="button",g.className="lv-sheet-moon lv-sheet-inbox-btn";let h=N.getUnreadCount();g.textContent=`🔔${h>0?` ${h}`:""}`,g.setAttribute("aria-label","全生态通知中心"),g.title=`通知中心历史 (${h} 未读)`,a.appendChild(g);let T=C.createElement("button");T.type="button",T.className="lv-sheet-moon lv-sheet-pref-btn",T.textContent="⚙",T.setAttribute("aria-label","设置"),T.title="罗盘入口与工作台设置",a.appendChild(T);let E=C.createElement("button");E.type="button",E.className="lv-sheet-close",E.setAttribute("aria-label","关闭"),E.textContent="✕",E.addEventListener("click",()=>$e()),a.appendChild(E),c.appendChild(a),n.appendChild(c);let S=C.createElement("div");S.className="lv-sheet-inbox-panel",S.style.display="none";let P=()=>{S.innerHTML="";let u=N.getHistory(),w=N.getUnreadCount(),x=C.createElement("div");if(x.style.cssText="display:flex;align-items:center;justify-content:space-between;padding-bottom:4px;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.1));",x.innerHTML=`
          <span style="font-size:12px;font-weight:700;color:var(--lv-lp-accent,#2563eb);">🔔 通知中心 (${w} 未读)</span>
          <div style="display:flex;gap:6px;">
            <button type="button" class="lv-sheet-action-chip lv-mobile-inbox-diag" title="复制生态诊断报告" style="padding:4px 10px;font-size:11px;">🩺诊断</button>
            <button type="button" class="lv-sheet-action-chip lv-mobile-inbox-mark" style="padding:4px 10px;font-size:11px;">全读</button>
            <button type="button" class="lv-sheet-action-chip lv-mobile-inbox-clear" style="padding:4px 10px;font-size:11px;">清空</button>
          </div>
        `,x.querySelector(".lv-mobile-inbox-diag")?.addEventListener("click",()=>{let M=x.querySelector(".lv-mobile-inbox-diag");M&&(M.textContent="…收集"),(async()=>{let _=!1,W="生成失败";try{let ce=await Rt.buildDiagnosticReport();_=await qt(ce)}catch(ce){W=ce instanceof Error?ce.message.slice(0,40):"生成失败"}M&&M.isConnected&&(M.textContent=_?"✓已复制":`✗${W}`),N.capsule({source:"通知中心",message:_?`🩺 诊断报告已复制，请发 QQ 群 ${Je} 或邮箱 ${Pt}`:`🩺 报告导出失败，可截图发 QQ 群 ${Je}`,duration:3e3,archive:!1}),Pe(()=>{try{M&&M.isConnected&&(M.textContent="🩺诊断")}catch{}},2200)})()}),x.querySelector(".lv-mobile-inbox-mark")?.addEventListener("click",()=>{N.markAllRead(),g.textContent="🔔",P()}),x.querySelector(".lv-mobile-inbox-clear")?.addEventListener("click",()=>{N.clearHistory(),g.textContent="🔔",P()}),S.appendChild(x),u.length===0){let M=C.createElement("div");M.style.cssText="text-align:center;padding:14px;color:var(--lv-lp-text-sub,#64748b);font-size:11.5px;",M.textContent="🌱 今日通知中心暂无消息",S.appendChild(M)}else u.slice(0,20).forEach(M=>{let _=C.createElement("div");_.style.cssText=`display:flex;flex-direction:column;gap:2px;padding:6px 8px;border-radius:8px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));font-size:11px;${M.read?"":"border-left:3px solid var(--lv-lp-accent,#2563eb);cursor:pointer;"}`;let W=(M.repeatCount||1)>1?`<span style="font-size:10px;font-weight:700;padding:0 5px;border-radius:999px;background:rgba(245,158,11,0.16);color:#f59e0b;font-variant-numeric:tabular-nums;">×${M.repeatCount}</span>`:"",ce=M.title?`<strong style="color:var(--lv-lp-text,#0f172a);">${v(M.title)}</strong>`:"";if(_.innerHTML=`
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                    <div style="display:flex;align-items:center;gap:4px;min-width:0;flex-wrap:wrap;">
                      <span style="font-weight:600;color:var(--lv-lp-accent,#2563eb);">${v(M.source||"小驴")}</span>
                      ${ce}
                      ${W}
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                      <button type="button" class="lv-sheet-action-chip lv-mobile-inbox-copy" style="min-height:28px;padding:3px 10px;font-size:11px;">复制</button>
                      <span style="font-size:10px;color:var(--lv-lp-text-sub,#64748b);font-variant-numeric:tabular-nums;">${fo(M.createdAt||ae.now())}</span>
                    </div>
                  </div>
                  <div style="color:var(--lv-lp-text,#0f172a);word-break:break-word;">${v(M.message)}</div>
                `,_.querySelector(".lv-mobile-inbox-copy")?.addEventListener("click",te=>{te.stopPropagation();let ye=te.currentTarget,V=`${M.source?`[${M.source}] `:""}${M.title?`${M.title}: `:""}${M.message||""}`.trim();qt(V).then(xe=>{xe&&(ye.textContent="已复制",Pe(()=>{try{ye.textContent="复制"}catch{}},1200))})}),M.read||_.addEventListener("click",te=>{if(te.target?.closest?.("button"))return;N.markRead(M.id);let V=N.getUnreadCount();g.textContent=`🔔${V>0?` ${V}`:""}`,P()}),M.action&&M.action.label){let te=C.createElement("button");te.type="button",te.className="lv-sheet-action-chip",te.style.cssText="margin-top:4px;align-self:flex-start;padding:4px 10px;font-size:11px;color:var(--lv-lp-accent);",te.textContent=M.action.label,te.addEventListener("click",()=>{N.markRead(M.id),$e();try{M.action?.onClick?.()}catch{}}),_.appendChild(te)}S.appendChild(_)})};g.addEventListener("click",()=>{oe(8);let u=S.style.display!=="none";S.style.display=u?"none":"flex",g.setAttribute("aria-pressed",String(!u)),u||(j.style.display="none",T.setAttribute("aria-pressed","false"),P())}),n.appendChild(S);let j=C.createElement("div");j.className="lv-sheet-inbox-panel",j.style.display="none";let D=()=>{let u=xt(),w=Qe();j.innerHTML=`
          <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:6px;border-bottom:1px dashed var(--lv-lp-border,rgba(15,23,42,0.1));">
            <span style="font-size:12px;font-weight:700;color:var(--lv-lp-accent,#2563eb);">⚙ 手机端入口与工作台设置</span>
            <span class="lv-mobile-pref-saved" style="font-size:10px;color:var(--lv-lp-text-sub,#64748b);">双击悬浮球极速闪记</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;padding:6px 0;font-size:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;">
              <span style="flex-shrink:0;">罗盘入口形态</span>
              <select class="lv-mobile-pref-mode" style="min-height:44px;max-width:58%;min-width:0;padding:4px 8px;border-radius:8px;border:1px solid var(--lv-lp-border-strong);background:var(--lv-lp-card-bg);color:var(--lv-lp-text);font-size:12px;box-sizing:border-box;">
                <option value="both" ${u==="both"?"selected":""}>悬浮球 + 顶栏按钮</option>
                <option value="ball" ${u==="ball"?"selected":""}>仅悬浮球</option>
                <option value="topbar" ${u==="topbar"?"selected":""}>仅顶栏按钮</option>
                <option value="none" ${u==="none"?"selected":""}>隐藏入口</option>
              </select>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;">
              <span style="flex-shrink:0;">LifeLog 分类</span>
              <input type="text" class="lv-mobile-pref-cats b3-text-field" value="${v(w.lifeLogCategories.join(", "))}" style="width:min(185px,58%);min-width:0;min-height:44px;font-size:12px;padding:4px 8px;border-radius:8px;box-sizing:border-box;text-overflow:ellipsis;" />
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;">
              <span style="flex-shrink:0;">日记笔记本</span>
              <select class="lv-mobile-pref-nb-select" style="width:min(185px,58%);min-width:0;min-height:44px;padding:4px 8px;border-radius:8px;border:1px solid var(--lv-lp-border-strong);background:var(--lv-lp-card-bg);color:var(--lv-lp-text);font-size:12px;box-sizing:border-box;text-overflow:ellipsis;">
                <option value="">✨ 自动识别默认日记本</option>
                ${w.lifeLogNotebookId?`<option value="${v(w.lifeLogNotebookId)}" selected>已选: ${v(w.lifeLogNotebookId)}</option>`:""}
              </select>
            </div>
            <button type="button" class="lv-sheet-action-chip lv-mobile-open-full-cfg-btn" style="margin-top:6px;width:100%;min-height:44px;padding:6px 10px;font-size:11.5px;color:var(--lv-lp-accent);background:var(--lv-lp-accent-soft);border:1px solid var(--lv-lp-border);border-radius:6px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:4px;">⚙️ 打开全功能分类设置中心 ➔</button>
          </div>
        `,j.querySelector(".lv-mobile-open-full-cfg-btn")?.addEventListener("click",()=>{$e(),Rn("workspace")});let x=(_="✓ 已保存")=>{let W=j.querySelector(".lv-mobile-pref-saved");W&&(W.textContent=_,W.style.color="#10b981",q.setTimeout(()=>{W.isConnected&&(W.textContent="双击悬浮球极速闪记",W.style.color="var(--lv-lp-text-sub,#64748b)")},1500))},M=j.querySelector(".lv-mobile-pref-nb-select");M&&lt().then(_=>{if(!M.isConnected||!_.length)return;let W=w.lifeLogNotebookId||"";M.innerHTML='<option value="">✨ 自动识别默认日记本</option>'+_.map(ce=>`<option value="${v(ce.id)}" ${ce.id===W?"selected":""}>📔 ${v(ce.name)}</option>`).join("")}).catch(()=>{}),j.querySelector(".lv-mobile-pref-mode")?.addEventListener("change",_=>{let W=_.target.value;dn(W),x("✓ 入口已切换")}),j.querySelector(".lv-mobile-pref-cats")?.addEventListener("change",_=>{let W=_.target.value.split(/[,，]/).map(ce=>ce.trim()).filter(Boolean);W.length>0&&(ze({lifeLogCategories:W}),x("✓ 分类已保存"))}),M?.addEventListener("change",_=>{let W=_.target.value.trim();ze({lifeLogNotebookId:W||void 0,diaryNotebookId:W||void 0,quickNoteNotebookId:W||void 0}),x("✓ 日记本已保存")})};T.addEventListener("click",()=>{oe(8);let u=j.style.display!=="none";j.style.display=u?"none":"flex",T.setAttribute("aria-pressed",String(!u)),u||(S.style.display="none",g.setAttribute("aria-pressed","false"),D())}),n.appendChild(j);let f=[];l.forEach(u=>{if(typeof u.badgeProvider=="function")try{let w=u.badgeProvider();w instanceof Promise?f.push({item:u,promise:w}):w&&typeof w=="string"?u.badge=w:u.badge=void 0}catch{}});let L=et(),y=!!L?.getItem(it)?.trim(),A=!!L?.getItem(rt)?.trim(),Q=y?'<span style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block;margin-left:2px;"></span>':"",re=A?'<span style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block;margin-left:2px;"></span>':"",fe=C.createElement("div");fe.className="lv-sheet-quick-grid",fe.innerHTML=`
      <button type="button" class="lv-sheet-quick-card" data-action="quick-note" aria-label="一键记事">
        <span class="lv-sheet-quick-icon">⚡</span>
        <span class="lv-sheet-quick-text">一键记事${Q}</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="paste-clip" aria-label="剪贴入库">
        <span class="lv-sheet-quick-icon">📋</span>
        <span class="lv-sheet-quick-text">剪贴入库</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="lifelog" aria-label="LifeLog 流">
        <span class="lv-sheet-quick-icon">📒</span>
        <span class="lv-sheet-quick-text">LifeLog${re}</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="random-walk" aria-label="随机漫步">
        <span class="lv-sheet-quick-icon">🎲</span>
        <span class="lv-sheet-quick-text">随机漫步</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="diary-bottom" aria-label="日记底部">
        <span class="lv-sheet-quick-icon">⬇️</span>
        <span class="lv-sheet-quick-text">日记底部</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="task-mgr" aria-label="任务管理器">
        <span class="lv-sheet-quick-icon">📋</span>
        <span class="lv-sheet-quick-text">任务管理</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="new-task" aria-label="新建任务">
        <span class="lv-sheet-quick-icon">➕</span>
        <span class="lv-sheet-quick-text">新建任务</span>
      </button>
      <button type="button" class="lv-sheet-quick-card" data-action="daily-review" aria-label="今日回顾">
        <span class="lv-sheet-quick-icon">📝</span>
        <span class="lv-sheet-quick-text">今日回顾</span>
      </button>
    `,fe.addEventListener("click",u=>{let x=u.target?.closest(".lv-sheet-quick-card");if(!x)return;let M=x.getAttribute("data-action");oe(10),M==="quick-note"?($e(),Xe()):M==="paste-clip"?(x.setAttribute("data-busy","true"),en().finally(()=>{try{x.removeAttribute("data-busy")}catch{}$e()})):M==="lifelog"?($e(),Nt()):M==="random-walk"?(x.setAttribute("data-busy","true"),Ht().finally(()=>{try{x.removeAttribute("data-busy")}catch{}$e()})):M==="diary-bottom"?(x.setAttribute("data-busy","true"),ot().finally(()=>{try{x.removeAttribute("data-busy")}catch{}})):M==="task-mgr"?Zt():M==="new-task"?(x.setAttribute("data-busy","true"),Jt().finally(()=>{try{x.removeAttribute("data-busy")}catch{}$e()})):M==="daily-review"&&(x.setAttribute("data-busy","true"),mn().finally(()=>{try{x.removeAttribute("data-busy")}catch{}$e()}))}),n.appendChild(fe);let ne=C.createElement("div");ne.className="lv-sheet-search-wrap";let Y=C.createElement("input");Y.type="text",Y.className="lv-sheet-search b3-text-field",Y.placeholder="🔍 搜索全家桶 (习惯 / 切片 / 资产 / 闪卡)…",Y.setAttribute("aria-label","全生态穿透搜索");let pe=C.createElement("button");pe.type="button",pe.className="lv-sheet-search-clear",pe.setAttribute("aria-label","清空搜索"),pe.textContent="✕",pe.addEventListener("click",()=>{oe(6),Y.value="",Y.dispatchEvent(new Re("input")),Y.focus({preventScroll:!0})}),ne.appendChild(Y),ne.appendChild(pe),n.appendChild(ne);let U=C.createElement("div");U.className="lv-sheet-results",n.appendChild(U);let de=C.createElement("div");de.className="lv-sheet-histrow",de.style.display="none";let J=()=>{de.textContent="";let u=Zn();if(!u.length||C.activeElement!==Y){de.style.display="none";return}de.style.display="flex";let w=C.createElement("span");w.className="lv-sheet-histrow-label",w.textContent="最近搜索",de.appendChild(w);for(let x of u.slice(0,5)){let M=C.createElement("button");M.type="button",M.className="lv-sheet-histrow-chip",M.textContent=x,M.addEventListener("click",()=>{oe(6),Y.value=x,Y.dispatchEvent(new Re("input")),Y.focus({preventScroll:!0})}),de.appendChild(M)}};Y.addEventListener("focus",()=>{Y.value.trim()||J()}),Y.addEventListener("blur",()=>{q.setTimeout(()=>{C.activeElement!==Y&&!Y.value.trim()&&(de.style.display="none")},180)}),n.appendChild(de);let le=C.createElement("div");le.className="lv-sheet-today-ticker";let b=0,K=!1;le.addEventListener("pointerdown",()=>{b+=1});let ue=()=>{b>0&&(b-=1),b===0&&K&&C.getElementById(at)&&(K=!1,ge())};le.addEventListener("pointerup",ue),le.addEventListener("pointercancel",ue);let ge=()=>{if(b>0){K=!0;return}K=!1,le.textContent="",vn(l).metrics.forEach(x=>{let M=x.status==="done",_=C.createElement("button");_.type="button",_.className=`lv-sheet-ticker-pill ${x.status}`,_.setAttribute("aria-label",`${x.name}：${x.label}`);let W=nt(x.pluginId,x.color),ce=M?"✓":x.count>0?String(x.count):x.status==="empty"?"–":"0";_.innerHTML=`<span class="lv-sheet-ticker-dot" style="background:${W};"></span><span>${v(x.shortName)}</span><span class="lv-sheet-ticker-val">${ce}</span>`,_.addEventListener("click",()=>{oe(8);let te=l.find(ye=>ye.id===x.pluginId);if(te){Ve(te.id),$e();try{te.onClick()}catch(ye){console.warn("[LvLaunchpad] 今日直达失败:",ye)}}}),le.appendChild(_)});let w=new Set(["siyuan-checkin","siyuan-lv-cards","siyuan-home","siyuan-glean"]);for(let x of l){if(w.has(x.id))continue;let M=/(\d+)/.exec(x.badge??"");if(M&&Number(M[1])>0){let _=C.createElement("button");_.type="button",_.className="lv-sheet-ticker-pill pending",_.setAttribute("aria-label",`今日待办直达 ${x.fullName||x.name}`);let W=nt(x.id,x.color);_.innerHTML=`<span class="lv-sheet-ticker-dot" style="background:${W};"></span><span>${v(x.name)}</span><span class="lv-sheet-ticker-val">${v(M[1]||"")}</span>`,_.addEventListener("click",()=>{oe(8),Ve(x.id),$e();try{x.onClick()}catch(ce){console.warn("[LvLaunchpad] 今日直达失败:",ce)}}),le.appendChild(_)}}};ge(),n.appendChild(le),f.forEach(({item:u,promise:w})=>{w.then(x=>{x&&typeof x=="string"?(u.badge=x,C.getElementById(at)&&(ge(),Ye())):!x&&u.badge&&(u.badge=void 0,C.getElementById(at)&&(ge(),Ye()))}).catch(()=>{})});let z=C.createElement("div");z.className="lv-sheet-eco-row";let G=[{label:"⚡ 打开雷切切片库",action:()=>{if(!Ne().executeAction("siyuan-speed-switch","打开切片库")){let w=q.siyuanSpeedSwitch;w&&typeof w.showSwitcher=="function"&&w.showSwitcher(!0)}}},{label:"💾 全家桶联合备份",action:async()=>{N.capsule({source:"罗盘",message:"💾 正在打包联合备份…",duration:2e3,archive:!1});try{let u=await rn.exportFull(),w=JSON.stringify(u,null,2),x=u.failed?.length??0,M=Object.keys(u.plugins||{}).length;if(tt()){let te=`/temp/xiaolv-backup-${dt()}.json`,V=(xe=>{let Ie=new TextEncoder().encode(xe),He="",Ae=32768;for(let me=0;me<Ie.length;me+=Ae){let Te=Ie.subarray(me,me+Ae),be="";for(let De=0;De<Te.length;De++)be+=String.fromCharCode(Te[De]);He+=be}return btoa(He)})(w);if(!V)throw new Error("base64 encode failed");if(typeof FormData<"u"&&typeof Blob<"u"&&typeof gt=="function"){let xe=new FormData;xe.append("path",te),xe.append("isDir","false"),xe.append("file",new Blob([w],{type:"application/json;charset=utf-8"}),`xiaolv-backup-${dt()}.json`),await $t(xe)}else{let xe=await se("/api/file/putFile",{path:te,file:V,isDir:!1});if(xe.code!==0)throw new Error(xe.msg||"putFile failed")}N.capsule({source:"罗盘",message:`💾 备份已写入工作空间 ${te}${x>0?`（${M} 项成功，${x} 项失败）`:""}`,duration:4500,level:x>0?"warn":"success",archive:!1});return}let _=new Blob([w],{type:"application/json;charset=utf-8"}),W=URL.createObjectURL(_),ce=C.createElement("a");ce.href=W,ce.download=`xiaolv-ecosystem-backup-${dt()}.json`,C.body.appendChild(ce),ce.click(),ce.remove(),Pe(()=>URL.revokeObjectURL(W),1e3),N.capsule({source:"罗盘",message:x>0?`已发起部分备份下载：${M} 项成功，${x} 项失败；详见备份清单`:"💾 联合备份下载已发起",duration:3200,level:x>0?"warn":"success"})}catch{N.capsule({source:"罗盘",message:"备份导出失败，请重试",duration:3e3,level:"error"})}}},{label:"♻️ 从备份恢复",action:async()=>{Nn()}},{label:"🧹 冲突排查与对账",action:async()=>{kt()}}];for(let u of G){let w=C.createElement("button");w.type="button",w.className="lv-sheet-eco-chip",w.textContent=u.label,w.title=u.label,w.addEventListener("click",()=>{oe(8);try{u.action()}catch(x){console.warn("[LvLaunchpad] eco action failed",x)}$e()}),z.appendChild(w)}let F=0,s;Y.addEventListener("input",()=>{let u=++F,w=Y.value.trim();if(s!==void 0){try{q.clearTimeout(s)}catch{}s=void 0}if(pe.classList.toggle("visible",!!w),U.textContent="",!w){J();return}de.style.display="none";let x=C.createElement("div");x.className="lv-sheet-result-count",x.textContent="🔍 正在流式检索全生态…",U.appendChild(x),s=q.setTimeout(()=>{s=void 0,!(u!==F||!C.getElementById(at))&&ro.searchStream(w,(M,_)=>{if(u!==F||!C.getElementById(at))return;if(U.textContent="",/^(查重|对账|冲突|排重|dup|dedup)/i.test(w.trim())){let V=C.createElement("button");V.type="button",V.className="lv-sheet-result",V.style.border="1px solid var(--lv-lp-accent, #2563eb)",V.style.background="var(--lv-lp-accent-soft, rgba(37,99,235,0.08))",V.innerHTML=`
                        <span class="lv-sheet-result-badge" style="background:rgba(239,68,68,0.12);color:#ef4444;">🧹 治理</span>
                        <span class="lv-sheet-result-body">
                            <span class="lv-sheet-result-title" style="color:var(--lv-lp-accent,#2563eb);font-weight:700;">全思源文档查重与对账治理</span>
                            <span class="lv-sheet-result-snippet">同名文档 · 段落去重 · 同步冲突与日记排重</span>
                        </span>
                    `,V.onclick=()=>{$e(),kt()},U.appendChild(V)}if(M.length>0){let V=C.createElement("div");V.className="lv-sheet-result-count";let xe=_.done?"":` · ${_.pending} 项检索中`;V.textContent=(M.length>12?`共 ${M.length} 条穿透结果 · 显示前 12 条`:`${M.length} 条穿透结果`)+xe,U.appendChild(V)}let ce=M.slice(0,12),te=new Map;for(let V of ce){let xe=V.source||V.badge||"小驴",Ie=te.get(xe);Ie?Ie.push(V):te.set(xe,[V])}let ye={打卡:"🏃",管家:"🏠",拾遗:"🔖",雷切:"✂️",闪卡:"🎴",考试:"📝",人脉:"👥",常用:"🔤"};for(let[V,xe]of te){let Ie=ye[V]||"🔹",He=C.createElement("div");He.className="lv-sheet-result-group",He.textContent=`${Ie} ${V} · ${xe.length} 条`,U.appendChild(He);for(let Ae of xe){let me=C.createElement("button");me.type="button",me.className="lv-sheet-result";let Te=C.createElement("span");Te.className="lv-sheet-result-badge",Te.textContent=`${Ie} ${V}`,me.appendChild(Te);let be=C.createElement("span");be.className="lv-sheet-result-body";let De=C.createElement("span");if(De.className="lv-sheet-result-title",De.textContent=Ae.title,be.appendChild(De),Ae.snippet){let Ee=C.createElement("span");Ee.className="lv-sheet-result-snippet",Ee.textContent=Ae.snippet,be.appendChild(Ee)}me.appendChild(be),me.addEventListener("click",()=>{pn(w),$e(),_t(),ho(Ae)}),U.appendChild(me)}}if(!M.length){let V=C.createElement("div");V.className=_.done?"lv-sheet-empty":"lv-sheet-result-count",_.done?(V.innerHTML=`
                            <div style="margin-bottom:8px;">未找到与 “<strong>${v(w)}</strong>” 相关的条目</div>
                            <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
                                <button type="button" class="lv-sheet-action-chip lv-mobile-empty-note" style="padding:4px 10px;font-size:11px;">⚡ 一键记事</button>
                                <button type="button" class="lv-sheet-action-chip lv-mobile-empty-task" style="padding:4px 10px;font-size:11px;">✅ 新建待办</button>
                            </div>
                        `,V.querySelector(".lv-mobile-empty-note")?.addEventListener("click",()=>{$e(),Xe(w)}),V.querySelector(".lv-mobile-empty-task")?.addEventListener("click",()=>{$e(),Xe("- [ ] "+w)})):V.textContent=`🔍 正在流式检索全生态 (${_.pending} 项进行中)…`,U.appendChild(V)}}).catch(()=>{})},85)});let I=Jn().map(u=>l.find(w=>w.id===u)).filter(u=>!!u);if(I.length>0){let u=C.createElement("div");u.className="lv-sheet-recent";let w=C.createElement("span");w.className="lv-sheet-recent-label",w.textContent="最近使用",u.appendChild(w);for(let x of I.slice(0,4)){let M=C.createElement("button");M.type="button",M.className="lv-sheet-recent-chip",M.setAttribute("data-recent-id",x.id),M.style.display="inline-flex",M.style.alignItems="center",M.style.gap="5px";let _=nt(x.id,x.color);M.innerHTML=`<span class="lv-sheet-ticker-dot" style="background:${_};"></span><span>${v(x.name||x.fullName||x.id)}</span>`,M.addEventListener("click",()=>{oe(8),Ve(x.id),$e(),_t();try{x.onClick()}catch(W){console.warn("[LvLaunchpad] 最近使用唤起失败:",W)}}),u.appendChild(M)}n.appendChild(u)}let B=C.createElement("div");B.className=l.length>0&&l.length<=2?"lv-sheet-grid lv-sheet-grid--sparse":"lv-sheet-grid";for(let u of l){let w=za(u);w&&B.appendChild(w)}if(!l.length){let u=C.createElement("div");if(u.className="lv-sheet-empty",r.length>0){let w=C.createElement("div");w.textContent=`已隐藏全部 ${r.length} 个已入驻插件`,u.appendChild(w);let x=C.createElement("button");x.type="button",x.className="lv-sheet-restore-hidden-btn",x.textContent="恢复显示全部隐藏插件",x.style.cssText="margin-top:8px;min-height:44px;padding:8px 16px;border-radius:999px;border:none;background:var(--b3-theme-primary,#2563eb);color:#fff;font-size:12.5px;font-weight:600;cursor:pointer;",x.addEventListener("click",()=>{Vn(),$e(!0),Co()}),u.appendChild(x)}else u.textContent="尚未有插件入驻罗盘";B.appendChild(u)}if(l.length>0){let u=C.createElement("div");u.className="lv-sheet-subtitle",u.textContent=`${l.length} 个插件入驻 · 长按磁贴展开快捷行动`,n.appendChild(u)}n.appendChild(B),n.appendChild(z),e.addEventListener("keydown",u=>{let w=u,x=w.target;if(x&&(x.tagName==="INPUT"||x.tagName==="TEXTAREA"||x.isContentEditable===!0))return;let M=Number(w.key);if(!Number.isInteger(M)||M<1||M>9)return;let W=B.querySelectorAll(".lv-sheet-tile")[M-1];W&&(w.preventDefault(),W.click())});let k=C.createElement("div");k.className="lv-sheet-hint",k.textContent="点击磁贴直达 · 长按展开行动 · 下滑 / 返回键 / 点空白关闭",n.appendChild(k);let $=C.createElement("div");$.className="lv-sheet-community-bar",$.style.cssText="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:8px 16px 12px;margin-top:6px;border-top:1px dashed var(--b3-theme-surface-lighter,rgba(15,23,42,0.08));font-size:11px;color:var(--b3-theme-on-surface);opacity:0.85;",$.innerHTML=`
        <div style="display:flex;align-items:center;gap:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            <span>💬 反馈群：<strong style="font-family:monospace;">${Je}</strong></span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <button type="button" class="lv-sheet-store-btn" style="min-height:44px;background:rgba(99, 102, 241, 0.15);color:#4f46e5;border:1px solid rgba(99, 102, 241, 0.35);border-radius:999px;padding:6px 12px;font-size:11.5px;font-weight:600;cursor:pointer;">📦 块助手</button>
            <button type="button" class="lv-sheet-sponsor-btn" style="min-height:44px;background:rgba(234, 179, 8, 0.15);color:#b45309;border:1px solid rgba(234, 179, 8, 0.35);border-radius:999px;padding:6px 12px;font-size:11.5px;font-weight:600;cursor:pointer;">⚡ 投喂 Token</button>
            <button type="button" class="lv-sheet-join-qq-btn" style="min-height:44px;background:var(--b3-theme-primary);color:#fff;border:none;border-radius:999px;padding:6px 14px;font-size:11.5px;font-weight:600;cursor:pointer;">🚀 加群</button>
        </div>
    `,$.querySelector(".lv-sheet-store-btn")?.addEventListener("click",u=>{u.stopPropagation(),$e(),je.openStoreDialog()}),$.querySelector(".lv-sheet-sponsor-btn")?.addEventListener("click",u=>{u.stopPropagation(),_n()}),$.querySelector(".lv-sheet-join-qq-btn")?.addEventListener("click",u=>{u.stopPropagation(),Wn()}),n.appendChild($),e.addEventListener("click",u=>{if(u.target===e){let w=ae.now(),x=u.clientX||0,M=u.clientY||0;if(w-H.getLastMobileTopbarTap().ts<360&&Math.hypot(x-H.getLastMobileTopbarTap().x,M-H.getLastMobileTopbarTap().y)<36){H.setLastMobileTopbarTap({ts:0,x:0,y:0}),oe(14),$e(!0),Nt();return}$e()}});let O=0,Z=!1,m=()=>{if(Z){Z=!1;try{n.classList.remove("lv-sheet-dragging"),n.style.transform="",n.style.animation=""}catch{}}};n.addEventListener("touchstart",u=>{O=u.touches[0]?.clientY??0},{passive:!0}),n.addEventListener("touchmove",u=>{let x=(u.touches[0]?.clientY??0)-O;if(!Z)if(x>24&&n.scrollTop<=2){Z=!0,n.classList.add("lv-sheet-dragging");try{n.style.animation="none"}catch{}}else return;let M=Math.max(0,x)*.5;try{n.style.transform=`translateY(${M.toFixed(1)}px)`}catch{}},{passive:!0}),n.addEventListener("touchend",u=>{let w=(u.changedTouches[0]?.clientY??0)-O,x=Z;m(),w>60?$e():x&&oe(6)},{passive:!0}),n.addEventListener("touchcancel",m,{passive:!0});try{Ge.push({id:"lv-launchpad-mobile-sheet",dismiss:()=>($e(),!0)})}catch{}try{let u=typeof q<"u"&&q.siyuan?.zIndex;e.style.zIndex=String(typeof u=="number"?Math.max(1080,u+30):1080)}catch{}if(C.body.appendChild(e),la(),typeof q<"u"&&q.visualViewport){let u=()=>{let w=q.visualViewport;if(!w||!e.isConnected)return;let x=Math.max(0,q.innerHeight-(w.offsetTop+w.height));x>100?(e.style.top="auto",e.style.bottom=`${x}px`,e.style.height=`${w.height}px`):(e.style.top="",e.style.bottom="",e.style.height="")};q.visualViewport.addEventListener("resize",u),q.visualViewport.addEventListener("scroll",u,{passive:!0}),Et().sheetViewportCleanup=()=>{q.visualViewport?.removeEventListener("resize",u),q.visualViewport?.removeEventListener("scroll",u),Et().sheetViewportCleanup=void 0}}if(e.addEventListener("keydown",u=>{let w=u;if(w.key!=="Tab")return;let x=Array.from(e.querySelectorAll("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])")).filter(W=>!W.hasAttribute("disabled")&&W.offsetParent!==null);if(x.length===0)return;let M=x[0],_=x[x.length-1];!M||!_||(w.shiftKey&&C.activeElement===M?(w.preventDefault(),_.focus({preventScroll:!0})):!w.shiftKey&&C.activeElement===_&&(w.preventDefault(),M.focus({preventScroll:!0})))}),!tt())try{Y.focus({preventScroll:!0})}catch{}ia(),oe(8)}function Ao(t){try{let e=q,n=[e?.siyuan?.ws?.app?.plugins,e?.siyuan?.plugins,e?.app?.plugins];for(let o of n)if(Array.isArray(o)){let r=o.find(l=>l?.name===t);if(r)return r}}catch{}return null}function Do(){if(!(typeof C>"u")){try{let t=C.querySelector("#barSetting");if(t){t.click(),q.setTimeout(()=>{try{let e=C.querySelector('.config__tab-item[data-name="bazaar"], .config__tabs .config__tab-item[data-name="bazaar"]');e&&e.click()}catch{}},260);return}}catch{}try{let t=C.createElement("a");t.href="siyuan://settings/bazaar",t.style.display="none",C.body.appendChild(t),t.click(),t.remove()}catch{}}}let At=-1;function Zt(){Se(),$e();let t=[()=>typeof globalThis.__taskHorizonOpenManagerFromTopbarEntry=="function"?globalThis.__taskHorizonOpenManagerFromTopbarEntry()!==!1:!1,()=>{let n=globalThis.__taskHorizonPluginInstance||Ao("siyuan-plugin-task-horizon");return n&&typeof n.openTaskManager=="function"?n.openTaskManager()!==!1:!1},()=>{let n=C.querySelector('[data-task-horizon-window-topbar="1"], [aria-label*="任务管理器"], [title*="任务管理器"], [id*="siyuan-plugin-task-horizon_task-manager"]');return n?(n.click(),!0):!1},()=>{let n=q.TaskHorizon||q.taskHorizon||q.siyuanTaskHorizon;return n&&typeof n.openView=="function"?(n.openView("calendar"),!0):!1}],e=At>=0&&At<t.length?[At,...t.map((n,o)=>o).filter(n=>n!==At)]:t.map((n,o)=>o);for(let n of e){let o=t[n];if(o)try{if(o()){At=n;return}}catch{}}try{if(Ne().executeAction("siyuan-checkin","查看今日待办")){N.capsule({source:"罗盘",message:"未检测到任务管理器，已为您打开今日待办",duration:2200,archive:!1});return}if(Ne().executeAction("siyuan-home","打开管家面板")){N.capsule({source:"罗盘",message:"未检测到任务管理器，已为您打开小驴管家",duration:2200,archive:!1});return}}catch{}N.capsule({source:"罗盘",message:"请在集市启用「任务管理器 (Task Horizon)」插件",duration:3200,archive:!1,action:{label:"打开集市",onClick:Do}})}let Tn=!1,Dt=-1;async function Jt(){if(Tn)return;Tn=!0,Se(),$e();let t=[async()=>{let e=globalThis;return typeof e.tmQuickAddOpen=="function"?(await e.tmQuickAddOpen(),!0):typeof e.tmAdd=="function"?(await e.tmAdd(),!0):!1},async()=>{let e=globalThis.__taskHorizonPluginInstance||Ao("siyuan-plugin-task-horizon");return e&&typeof e.openQuickAddTaskWindow=="function"?await e.openQuickAddTaskWindow()!==!1:!1},async()=>{let e=C.querySelector(".tm-topbar-add-btn, .tm-quick-add-btn, [data-action='quick-add'], [onclick*='tmAdd'], [onclick*='tmQuickAddOpen'], [data-tm-floating-tooltip-label='新建任务'], [aria-label*='新建任务'], [title*='新建任务']");return e?(e.click(),!0):!1}];try{let e=Dt>=0&&Dt<t.length?[Dt,...t.map((n,o)=>o).filter(n=>n!==Dt)]:t.map((n,o)=>o);for(let n of e){let o=t[n];if(o)try{if(await o()){Dt=n;return}}catch{}}try{if(Ne().executeAction("siyuan-checkin","快速记事")){N.capsule({source:"罗盘",message:"未检测到任务管理器，已为您打开快速记事",duration:2200,archive:!1});return}}catch{}N.capsule({source:"罗盘",message:"未检测到任务管理器",duration:3200,archive:!1,action:{label:"记一条待办",onClick:()=>Xe("- [ ] ")}})}finally{Tn=!1}}let In=!1;async function Cn(){if(!In){In=!0,Se(!0),$e(),N.capsule({source:"罗盘",message:"🔄 正在重载思源界面…",duration:1500,archive:!1}),await new Promise(t=>Pe(t,60));try{let t=await se("/api/ui/reloadUI",{});if(t&&t.code===0)return;N.capsule({source:"罗盘",message:"内核重载接口异常，已降级为浏览器刷新",duration:2e3,level:"warn",archive:!1})}catch{}finally{In=!1}try{typeof q<"u"&&q.location&&typeof q.location.reload=="function"&&q.location.reload()}catch{}}}let Xt=[],Mn=!1;async function Ht(){if(Mn)return;Mn=!0,Se(),$e();let t=ht()?.id||"",e=new Set(Xt);t&&e.add(t);let n=r=>{let l=r.filter(T=>T&&T.id);if(!l.length)return null;let c=l.filter(T=>!e.has(String(T.id))),i=c.length>0?c:l,a=i[Math.floor(Math.random()*i.length)]||i[0],d=a.content||a.hpath||"未命名笔记",p=String(d).split("/").pop()||"笔记",g=String(a.hpath||"").split("/").filter(Boolean),h=g.length>1?g.slice(0,-1).join("/"):void 0;return{id:String(a.id),title:p,folder:h}},o=async(r,l,c="漫步",i,a="")=>{if(!await Ze(r))return!1;Xt.push(r),Xt.length>12&&Xt.shift();let p=i?` · ${i.slice(0,18)}`:"";N.capsule({source:c,message:`🎲 ${a}《${l.slice(0,18)}》${p}`,duration:3800,archive:!1,action:{label:"换一篇",onClick:()=>{Ht()}}});try{yt().record({category:"note",source:"罗盘",title:`漫步至《${l.slice(0,20)}》`,linkBlockId:r})}catch{}return!0};try{try{let T=await se("/api/query/sql",{stmt:"SELECT id, content, hpath FROM blocks WHERE type = 'd' AND length(trim(content)) > 0 AND updated > strftime('%Y%m%d%H%M%S','now','-90 days') AND hpath NOT LIKE '%/templates%' AND hpath NOT LIKE '%/模板%' ORDER BY random() LIMIT 12"}),E=Array.isArray(T?.data)?n(T.data):null;if(E&&await o(E.id,E.title,"漫步",E.folder,"近期 · "))return}catch{}let l=await se("/api/query/sql",{stmt:"SELECT id, content, hpath FROM blocks WHERE type = 'd' AND length(trim(content)) > 0 AND hpath NOT LIKE '%/templates%' AND hpath NOT LIKE '%/模板%' ORDER BY random() LIMIT 12"}),c=Array.isArray(l?.data)?n(l.data):null;if(c&&await o(c.id,c.title,"漫步",c.folder))return;let a=await se("/api/query/sql",{stmt:"SELECT id, content, hpath FROM blocks WHERE type = 'd' ORDER BY random() LIMIT 12"}),d=Array.isArray(a?.data)?n(a.data):null;if(d&&await o(d.id,d.title,"漫步",d.folder))return;let p=typeof q<"u"?q.siyuanContacts:null;if(p&&typeof p.searchPeople=="function")try{let h=await p.searchPeople("");if(Array.isArray(h)&&h.length>0){let T=h.filter(P=>P?.docId),E=T.filter(P=>!e.has(String(P.docId))),S=E.length>0?E:T;if(S.length>0){let P=S[Math.floor(Math.random()*S.length)],j=P.name?`人脉·${P.name}`:"人脉档案";if(await o(String(P.docId),j,"人脉漫步"))return}}}catch{}let g=await se("/api/filetree/searchDocs",{k:""});if(Array.isArray(g?.data)&&g.data.length>0){let h=g.data.filter(E=>E?.path&&!/\/(templates|模板)\//i.test(String(E.hPath||E.path))).map(E=>({id:String(E.path).replace(/^.*\//,"").replace(/\.sy$/i,""),content:String(E.hPath||E.path).split("/").pop()||"笔记",hpath:E.hPath})),T=n(h);if(T&&await o(T.id,T.title,"漫步",T.folder))return}N.capsule({source:"漫步",message:"当前知识库与人脉库暂无可漫游的文档",duration:2400,level:"warn",archive:!1})}catch(r){console.warn("[LvLaunchpad] 随机漫步查询失败:",r),N.capsule({source:"漫步",message:"随机漫步查询异常，请稍后重试",duration:2400,level:"warn",archive:!1})}finally{Mn=!1}}let An=!1,Dn="",Hn=0;function zn(t,e){let n=t.split(/\r?\n/).map(o=>o.trim()).filter(Boolean);if(n.length>1&&n.every(o=>/^https?:\/\/\S+$/i.test(o)))return n.map(o=>`- **${e}** 🔗 [${o}](${o})`).join(`
`);if(/^https?:\/\/\S+$/i.test(t))return`- **${e}** 🔗 [${t}](${t})`;if(t.includes(`
`)){let o=t.split(/\r?\n/);return`- **${e}** 📋 剪贴速记：
`+o.map(r=>`  ${r.trim()?"> "+r:">"}`).join(`
`)}return`- **${e}** 📋 ${t}`}async function Na(){try{let e=(typeof q<"u"?q.require?.("electron"):null)?.clipboard?.readImage?.();if(!e||typeof e.isEmpty=="function"&&e.isEmpty())return null;let n=typeof e.toPNG=="function"?e.toPNG():null,o=globalThis.Buffer;if(!n||!o?.from)return null;let r=String(o.from(n).toString("base64")||"");if(!r)return null;let l=new ae,i=`lv-clip-${`${l.getFullYear()}${String(l.getMonth()+1).padStart(2,"0")}${String(l.getDate()).padStart(2,"0")}-${String(l.getHours()).padStart(2,"0")}${String(l.getMinutes()).padStart(2,"0")}${String(l.getSeconds()).padStart(2,"0")}`}.png`;return(await se("/api/file/putFile",{path:`/assets/${i}`,file:r,isDir:!1})).code!==0?null:`![剪贴图片](assets/${i})`}catch{return null}}async function Ho(t,e,n){try{if(typeof C>"u")return null;let o=await new Promise((S,P)=>{let j=new FileReader;j.onload=()=>S(String(j.result||"")),j.onerror=()=>P(new Error("read failed")),j.readAsDataURL(t)});if(!o)return null;let r=await new Promise(S=>{let P=new Image;P.onload=()=>S(P),P.onerror=()=>S(null),P.src=o});if(!r||!(r.naturalWidth>0))return null;let c=Math.min(1,1600/Math.max(r.naturalWidth,r.naturalHeight)),i=Math.max(1,Math.round(r.naturalWidth*c)),a=Math.max(1,Math.round(r.naturalHeight*c)),d=C.createElement("canvas");d.width=i,d.height=a;let p=d.getContext("2d");if(!p)return null;p.fillStyle="#ffffff",p.fillRect(0,0,i,a),p.drawImage(r,0,0,i,a);let g=d.toDataURL("image/jpeg",.85),h=g.slice(g.indexOf(",")+1);if(!h)return null;let T=`lv-lifelog-${e}-${String(n).padStart(2,"0")}.jpg`;return(await se("/api/file/putFile",{path:`/assets/${T}`,file:h,isDir:!1})).code!==0?null:{path:`assets/${T}`,thumb:g}}catch{return null}}function Nn(){ft({icon:"♻️",title:"联合备份 · 恢复",badgeHtml:'<span class="lv-qw-badge">将覆盖当前各插件数据</span>',bodyHtml:'<div class="lv-restore-warn">⚠️ 恢复会用备份包中的数据<strong>覆盖</strong>各插件当前数据，请确认已了解影响。</div><div class="lv-restore-pick"><button type="button" class="lv-qw-tag-chip lv-restore-pick-btn">📂 选择备份文件 (.json)</button><input type="file" class="lv-restore-input" accept=".json,application/json,text/plain,application/octet-stream" style="display:none;" /></div><div class="lv-restore-summary" style="display:none;"></div>',primaryLabel:"确认恢复并覆盖",onSave:async(l,c)=>{let a=(typeof C<"u"?C.querySelector("#lv-quick-workspace-mask .lv-restore-input"):null)?.files?.[0];if(!a){N.capsule({source:"联合备份",message:"请先选择备份文件（.json）",duration:2200,level:"warn",archive:!1});return}let d=l?.textContent||"确认恢复并覆盖";l&&(l.textContent="恢复中…");try{let p=await a.text(),g=JSON.parse(p),h=await rn.restoreFull(g);c();let T=h.success.length,E=h.failed||[];N.capsule({source:"联合备份",message:E.length>0?`♻️ 恢复完成：${T} 个插件成功，${E.length} 项失败（${E.slice(0,3).join("、")}${E.length>3?"…":""}）`:`♻️ 恢复完成：${T} 个插件数据已回灌`,duration:4200,level:E.length>0?"warn":"success",archive:!1})}catch{l&&(l.textContent=d),N.capsule({source:"联合备份",message:"恢复失败：文件解析或写入异常，请确认是本生态导出的备份包",duration:3200,level:"error",archive:!1})}}});let t=typeof C<"u"?C.getElementById("lv-quick-workspace-mask"):null,e=t?.querySelector(".lv-restore-pick-btn"),n=t?.querySelector(".lv-restore-input"),o=t?.querySelector(".lv-restore-summary"),r=t?.querySelector(".lv-qw-btn-primary");r&&(r.disabled=!0),e?.addEventListener("click",()=>{oe(6),n?.click()}),n?.addEventListener("change",()=>{let l=n.files?.[0];!l||!o||l.text().then(c=>{let i=JSON.parse(c),a=Object.keys(i?.plugins||{}),d=Array.isArray(i?.failed)?i.failed.length:0,p=String(i?.exportedAt||"").replace("T"," ").slice(0,19);o.style.display="flex",o.innerHTML=`📦 ${v(String(i?.ecosystem||"?"))} 备份 · 导出于 ${v(p||"未知时间")} · 含 <strong>${a.length}</strong> 个插件数据${d>0?` · 导出时 ${d} 项失败`:""}${a.length?`<br><span style="opacity:.75;">${v(a.slice(0,6).join(" · "))}${a.length>6?" …":""}</span>`:""}`,r&&(r.disabled=!1)}).catch(()=>{o.style.display="flex",o.textContent="⚠️ 无法解析该文件：不是合法的小驴灾备包（.json）",r&&(r.disabled=!0)})})}function zt(t,e){return typeof C>"u"?Promise.resolve(!1):new Promise(n=>{let o=!1,r=`lv-confirm-${ae.now()}-${Math.random().toString(36).slice(2,6)}`,l=C.createElement("div");l.className="b3-dialog__container lv-dialog",l.style.zIndex="100001",l.innerHTML=`
            <div class="b3-dialog" style="max-width: 420px; width: 90vw;">
                <div class="b3-dialog__header">
                    <div class="b3-dialog__title">${v(t)}</div>
                    <button class="b3-dialog__close" type="button" aria-label="关闭"><svg><use xlink:href="#iconClose"></use></svg></button>
                </div>
                <div class="b3-dialog__content" style="padding: 16px 20px; line-height: 1.6; font-size: 13px; color: var(--b3-theme-on-surface); white-space: pre-wrap;">${v(e)}</div>
                <div class="b3-dialog__action">
                    <button class="b3-button b3-button--cancel" type="button">取消</button>
                    <button class="b3-button b3-button--text" type="button">确认</button>
                </div>
            </div>
        `;let c=null,i=d=>{if(!o){o=!0;try{c?.()}catch{}c=null,C.removeEventListener("keydown",a,!0),l.remove(),n(d)}},a=d=>{d.isComposing||d.keyCode===229||(d.key==="Escape"?(d.preventDefault(),d.stopPropagation(),i(!1)):d.key==="Enter"&&(d.preventDefault(),i(!0)))};c=Ge.push({id:r,type:"dialog",dismiss:()=>(i(!1),!0)}),C.addEventListener("keydown",a,!0),l.querySelector(".b3-dialog__close")?.addEventListener("click",()=>i(!1)),l.querySelector(".b3-button--cancel")?.addEventListener("click",()=>i(!1)),l.querySelector(".b3-button--text")?.addEventListener("click",()=>i(!0)),l.addEventListener("click",d=>{d.target===l&&i(!1)}),C.body.appendChild(l)})}function Bn(t,e,n=""){return typeof C>"u"?Promise.resolve(null):new Promise(o=>{let r=!1,l=`lv-prompt-${ae.now()}-${Math.random().toString(36).slice(2,6)}`,c=C.createElement("div");c.className="b3-dialog__container lv-dialog",c.style.zIndex="100001",c.innerHTML=`
            <div class="b3-dialog" style="max-width: 440px; width: 90vw;">
                <div class="b3-dialog__header">
                    <div class="b3-dialog__title">${v(t)}</div>
                    <button class="b3-dialog__close" type="button" aria-label="关闭"><svg><use xlink:href="#iconClose"></use></svg></button>
                </div>
                <div class="b3-dialog__content" style="padding: 16px 20px; line-height: 1.5; font-size: 12.5px; color: var(--b3-theme-on-surface);">
                    <div style="margin-bottom: 8px;">${v(e)}</div>
                    <input type="text" class="b3-text-field fn__block" value="${v(n)}" style="width: 100%; box-sizing: border-box; padding: 6px 10px; font-size: 13px;" />
                </div>
                <div class="b3-dialog__action">
                    <button class="b3-button b3-button--cancel" type="button">取消</button>
                    <button class="b3-button b3-button--text" type="button">确定</button>
                </div>
            </div>
        `;let i=c.querySelector("input"),a=null,d=g=>{if(!r){r=!0;try{a?.()}catch{}a=null,C.removeEventListener("keydown",p,!0),c.remove(),o(g)}},p=g=>{g.isComposing||g.keyCode===229||(g.key==="Escape"?(g.preventDefault(),g.stopPropagation(),d(null)):g.key==="Enter"&&(g.preventDefault(),d(i?.value.trim()??null)))};a=Ge.push({id:l,type:"dialog",dismiss:()=>(d(null),!0)}),C.addEventListener("keydown",p,!0),c.querySelector(".b3-dialog__close")?.addEventListener("click",()=>d(null)),c.querySelector(".b3-button--cancel")?.addEventListener("click",()=>d(null)),c.querySelector(".b3-button--text")?.addEventListener("click",()=>d(i?.value.trim()??null)),c.addEventListener("click",g=>{g.target===c&&d(null)}),C.body.appendChild(c),Pe(()=>{i?.focus(),i?.select()},50)})}function kt(){let t="doc-titles",e=[],n=[],o=[],r={removedCount:0,duplicateGroups:0,details:[]},l=[],c=[],i=[],a="",d=6,p="all",g=!0,h=!1,T=!1,E=!1,S=null,P=null,j=null,D=new Map,f=()=>{try{P?.abort()}catch{}P=null;try{j?.destroy()}catch{}j=null,E=!1},L=()=>{for(let b of D.values()){try{b.ctrl?.abort()}catch{}try{b.handle?.destroy()}catch{}}D.clear()},y=ht();ft({icon:"🧹",title:"全思源文档查重与对账治理",badgeHtml:'<span class="lv-qw-badge">全库级自愈中枢 v3.0</span>',onBeforeClose:()=>{f(),L()},bodyHtml:`
            <div class="lv-conflict-top-bar" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));">
                <div class="lv-reconcile-stats" style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;">
                    <span class="lv-reconcile-stat-chip lv-stat-titles" title="全库检测到的同名文档组数">📑 同名文档: <b class="lv-stat-titles-val">...</b></span>
                    <span class="lv-reconcile-stat-chip lv-stat-empty" style="color:#ef4444;" title="内容为 0 字且无子文档的误建空壳">⚪ 0字空壳: <b class="lv-stat-empty-val">...</b></span>
                    <span class="lv-reconcile-stat-chip lv-stat-conflicts" style="color:#d97706;" title="多端同步冲突文档">⚡ 同步冲突: <b class="lv-stat-conflicts-val">...</b></span>
                    <span class="lv-reconcile-stat-chip lv-stat-orphans" style="color:#2563eb;" title="误建在插件专属本的孤立日记">📅 孤立日记: <b class="lv-stat-orphans-val">...</b></span>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <button type="button" class="lv-qw-tag-chip lv-ai-health-btn" style="padding:3px 9px;font-size:11px;color:#7c3aed;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.25);font-weight:700;">🤖 AI 全景体检</button>
                    <button type="button" class="lv-qw-tag-chip lv-export-audit-btn" style="padding:3px 9px;font-size:11px;color:var(--lv-lp-accent,#2563eb);background:var(--lv-lp-accent-soft,rgba(37,99,235,0.08));border:1px solid var(--lv-lp-border,rgba(15,23,42,0.12));">📄 导出对账单</button>
                </div>
            </div>
            <div class="lv-ai-health-container" style="display:none;margin-bottom:8px;padding:12px 14px;border-radius:10px;background:linear-gradient(135deg,rgba(124,58,237,0.05) 0%,rgba(37,99,235,0.05) 100%);border:1px solid rgba(124,58,237,0.2);"></div>
            <div class="lv-conflict-tabs" style="display:flex;gap:6px;margin-bottom:8px;border-bottom:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));padding-bottom:6px;align-items:center;overflow-x:auto;">
                <button type="button" class="lv-conflict-tab active" data-tab="doc-titles">📑 全库同名文档 <span class="lv-dup-tab-badge lv-dup-badge-titles" style="font-size:10px;padding:1px 5px;border-radius:10px;background:rgba(15,23,42,0.06);margin-left:2px;">...</span></button>
                <button type="button" class="lv-conflict-tab" data-tab="sync-conflict">⚡ 同步冲突与对账 <span class="lv-dup-tab-badge lv-dup-badge-conflicts" style="font-size:10px;padding:1px 5px;border-radius:10px;background:rgba(15,23,42,0.06);margin-left:2px;">...</span></button>
                <button type="button" class="lv-conflict-tab" data-tab="doc-blocks">📝 当前文档排重 <span class="lv-dup-tab-badge lv-dup-badge-blocks" style="font-size:10px;padding:1px 5px;border-radius:10px;background:rgba(15,23,42,0.06);margin-left:2px;">...</span></button>
                <button type="button" class="lv-conflict-tab" data-tab="whitelist">🛡️ 忽略白名单 <span class="lv-dup-tab-badge lv-dup-badge-whitelist" style="font-size:10px;padding:1px 5px;border-radius:10px;background:rgba(15,23,42,0.06);margin-left:2px;">0</span></button>
            </div>
            <div class="lv-conflict-tab-view" style="min-height:220px;max-height:60vh;overflow-y:auto;display:flex;flex-direction:column;gap:8px;font-size:12px;">
                <div style="text-align:center;padding:28px;color:var(--lv-lp-text-sub,#64748b);">⏳ 正在深度检索思源全库…</div>
            </div>
            <div class="lv-conflict-result" style="display:none;margin-top:8px;padding:8px 12px;border-radius:8px;font-size:11.5px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);color:var(--lv-lp-text,#0f172a);"></div>
        `,primaryLabel:"一键清理全库 0 字空壳",secondaryLabel:"重新检测",onSave:async(b,K,ue)=>{if(ue){de();return}let ge=b?.textContent||"一键安全治理";b&&(b.textContent="治理执行中…");try{if(t==="doc-titles"){let z=e.reduce((s,I)=>s+I.docs.filter(B=>B.id!==I.recommendedKeepId&&B.length===0&&(B.childCount||0)===0).length,0);if(z===0){N.capsule({source:"查重对账",message:"全库暂无可安全清理的 0 字空壳同名副本",duration:2500,level:"info",archive:!1}),b&&(b.textContent=ge);return}if(!await zt("🧹 0字空壳安全清理",`系统检测到全库共有 ${z} 篇 0 字且无子文档的误建空壳副本！

这些空壳通常因误触新建或大纲占位产生，清理后将移入废纸篓（可随时撤销还原），并完整保留已有正文的真身。

确认立即清理？`)){b&&(b.textContent=ge);return}let F=await ke.cleanAllEmptyShells(e);if(K(),typeof q<"u")try{q.dispatchEvent(new tn("lv-dedup:reconciled",{detail:{mode:"doc-titles",count:F.cleanedCount,at:new ae().toISOString()}}))}catch{}N.capsule({source:"文档查重",message:F.cleanedCount>0?`🧹 清理完成：已将 ${F.cleanedCount} 篇 0 字空壳副本移入废纸篓`:"全库文档名称唯一，无需清理",duration:3500,level:"success",archive:!1})}else if(t==="doc-blocks"){if(!y?.id){N.capsule({source:"段落排重",message:"未检测到活跃打开的文档",duration:2500,level:"warn",archive:!1});return}let z=await ke.deduplicateDocBlocks(y.id,d);if(K(),typeof q<"u")try{q.dispatchEvent(new tn("lv-dedup:reconciled",{detail:{mode:"doc-blocks",count:z.removedCount,at:new ae().toISOString()}}))}catch{}N.capsule({source:"段落排重",message:z.removedCount>0?`🧹 清理完成：已从《${y.title}》剔除 ${z.removedCount} 处重复块！`:"当前文档内容唯一，无重复块",duration:3500,level:"success",archive:!1})}else if(t==="sync-conflict"){let z=0;for(let I of o)await ke.safeRemoveDocToRecycle(I.id,I.box)&&z++;let G=await ke.deduplicateDailyLifeLogs(void 0,!1),F=0;for(let I of l)if(I.docIds.length>1){let B=I.docIds.slice(1);for(let k of B){let $=I.docs?.find(O=>O.id===k);await ke.safeRemoveDocToRecycle(k,$?.box)&&F++}}K();let s=z+G.removedCount+F;if(typeof q<"u")try{q.dispatchEvent(new tn("lv-dedup:reconciled",{detail:{mode:"sync-conflict",count:s,at:new ae().toISOString()}}))}catch{}N.capsule({source:"对账治理",message:s>0?`🧹 治理完成：已清理 ${z} 篇冲突分叉、${G.removedCount} 条重复流水、${F} 篇冗余剪藏！`:"全库同步与记事状态极佳，无冗余数据！",duration:3800,level:"success",archive:!1})}else K()}catch{b&&(b.textContent=ge),N.capsule({source:"查重对账",message:"去重执行异常，请稍后重试",duration:2500,level:"error",archive:!1})}}});let A=typeof C<"u"?C.getElementById("lv-quick-workspace-mask"):null,Q=A?.querySelector(".lv-qw-card");Q&&(Q.style.width="min(1060px, 96vw)",Q.style.maxWidth="1060px");let re=A?.querySelector(".lv-conflict-tab-view"),fe=A?.querySelector(".lv-qw-btn-primary"),ne=A?.querySelector(".lv-ai-health-container"),Y=()=>{let b=A?.querySelector(".lv-dup-badge-titles"),K=A?.querySelector(".lv-dup-badge-blocks"),ue=A?.querySelector(".lv-dup-badge-conflicts"),ge=A?.querySelector(".lv-dup-badge-whitelist"),z=Un(),G=e.filter($=>!$.isBenign&&!$.isIgnored).length;b&&(b.textContent=String(G)),K&&(K.textContent=String(i.length)),ue&&(ue.textContent=String(o.length+r.duplicateGroups+l.length+c.length)),ge&&(ge.textContent=String(z.size));let F=e.reduce(($,O)=>$+O.docs.filter(Z=>Z.id!==O.recommendedKeepId&&Z.length===0&&(Z.childCount||0)===0).length,0),s=A?.querySelector(".lv-stat-titles-val"),I=A?.querySelector(".lv-stat-empty-val"),B=A?.querySelector(".lv-stat-conflicts-val"),k=A?.querySelector(".lv-stat-orphans-val");if(s&&(s.textContent=`${e.length}组`),I&&(I.textContent=`${F}篇`),B&&(B.textContent=`${o.length}篇`),k&&(k.textContent=`${c.length}篇`),fe)if(t==="doc-titles")fe.textContent=F>0?`🧹 一键清理全库 0 字空壳 (${F}篇)`:"全库同名状态受控";else if(t==="sync-conflict"){let $=o.length>0||r.duplicateGroups>0||l.length>0;fe.textContent=$?"一键安全治理清洗":"同步状态极佳"}else t==="doc-blocks"?fe.textContent=i.length>0?`清理当前文档 ${i.length} 组重复`:"文档内容健康":fe.textContent="完成"},pe=()=>{if(ne){if(!T){ne.style.display="none";return}if(ne.style.display="block",E){(!j||j.element?.parentElement!==ne)&&(j?.destroy(),j=to(ne,{scenario:"doc-judge",compact:!0,title:"🤖 AI 全库文档架构健康度诊断中",cancelLabel:"⏹ 取消诊断",signal:P?.signal,onCancel:()=>{f(),T=!1,pe()}}));return}j?.destroy(),j=null,S&&(ne.innerHTML=`
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-weight:700;color:#7c3aed;">🤖 全库对账健康度 AI 诊断简报</span>
                        <span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(124,58,237,0.1);color:#7c3aed;font-weight:600;">双引擎参谋</span>
                    </div>
                    <button type="button" class="lv-qw-tag-chip lv-close-health-btn" style="padding:1px 6px;font-size:10px;">收起</button>
                </div>
                ${S.summaryHtml}
            `)}},U=()=>{if(re)if(L(),Y(),pe(),A?.querySelectorAll(".lv-conflict-tab").forEach(b=>{b.classList.toggle("active",b.getAttribute("data-tab")===t)}),t==="doc-titles"){if(e.length===0){re.innerHTML='<div style="text-align:center;padding:36px 16px;color:#10b981;font-weight:600;">🎉 全库检测通过：全库所有文档标题唯一，无任何同名重复分叉！</div>';return}let b=a.trim().toLowerCase(),K=e;b&&(K=K.filter(s=>s.title.toLowerCase().includes(b)||s.docs.some(I=>I.hpath.toLowerCase().includes(b)))),h||(K=K.filter(s=>!s.isIgnored)),g&&(K=K.filter(s=>!s.isBenign)),p==="empty"?K=K.filter(s=>s.hasEmptyShell):p==="fork"&&(K=K.filter(s=>s.isSuspectedFork));let ue=e.filter(s=>s.isBenign).length,ge=e.filter(s=>s.hasEmptyShell).length,z=e.filter(s=>s.isSuspectedFork&&!s.isBenign).length,G=e.filter(s=>s.isIgnored).length;n=K,re.innerHTML=`
                <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center;flex-wrap:wrap;">
                    <input type="search" class="lv-dup-search-input" placeholder="🔍 快速过滤同名文档（输入标题或路径关键字）…" value="${v(a)}" style="flex:1;min-width:200px;box-sizing:border-box;padding:6px 10px;border-radius:6px;border:1px solid var(--lv-lp-border,rgba(15,23,42,0.12));background:var(--lv-lp-card-bg,#fff);font-size:11.5px;color:var(--lv-lp-text,#0f172a);outline:none;">
                    <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
                        <button type="button" class="lv-reconcile-filter-chip ${p==="all"?"active":""}" data-cat="all">全部 (${e.length})</button>
                        <button type="button" class="lv-reconcile-filter-chip ${p==="empty"?"active":""}" data-cat="empty" style="${ge>0?"color:#ef4444;":""}">⚪ 仅看含空壳 (${ge})</button>
                        <button type="button" class="lv-reconcile-filter-chip ${p==="fork"?"active":""}" data-cat="fork" style="${z>0?"color:#d97706;":""}">⚠️ 仅看疑似分叉 (${z})</button>
                        <button type="button" class="lv-qw-tag-chip lv-toggle-benign-filter-btn" style="padding:4px 9px;font-size:11px;white-space:nowrap;${g?"background:rgba(16,185,129,0.12);color:#059669;border-color:rgba(16,185,129,0.3);font-weight:700;":""}" title="点击切换是否隐藏月份（如11月）、年份（如2024）等合法同名结构">🟢 ${g?`已排除 ${ue} 组时间/结构同名`:"显示全部 (含月份/年份)"}</button>
                        ${G>0?`<button type="button" class="lv-qw-tag-chip lv-toggle-ignored-filter-btn" style="padding:4px 9px;font-size:11px;${h?"background:rgba(37,99,235,0.1);color:#2563eb;font-weight:700;":""}">🛡️ ${h?"已显示白名单":`查看已忽略 (${G})`}</button>`:""}
                    </div>
                </div>
                <div class="lv-restore-warn" style="font-size:11px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
                    <div>
                        全库共发现 <strong>${e.length}</strong> 组同名文档${ue>0&&g?`（已智能保护并隐去 <strong>${ue}</strong> 组月份/年份/章节结构名）`:""}。系统支持充分内容比对与增量合并，独立主题请勿误删。
                    </div>
                    <div style="font-size:10.5px;opacity:.8;">
                        💡 提示：点击【⚖️ 双栏对比】或【🤖 AI 研判】可一键采纳合并/改名建议
                    </div>
                </div>
                ${K.length===0?`
                    <div style="text-align:center;padding:28px;color:var(--lv-lp-text-sub,#64748b);">当前筛选视图下无匹配的疑似重复同名文档</div>
                `:K.map((s,I)=>{let B=`g_${I}_`+v(s.title).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g,"_").slice(0,32),k=s.docs.filter($=>$.id!==s.recommendedKeepId&&$.length===0&&($.childCount||0)===0);return`
                        <div style="padding:9px 12px;border-radius:9px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.1));display:flex;flex-direction:column;gap:7px;">
                            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                                <div style="display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:200px;">
                                    <span style="font-weight:700;font-size:12.5px;color:var(--lv-lp-text);">《${v(s.title)}》</span>
                                    <span style="font-size:10px;opacity:.75;padding:1px 6px;border-radius:4px;background:var(--lv-lp-accent-soft);color:var(--lv-lp-accent);">${s.count} 篇同名</span>
                                    ${s.isBenign?'<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(16,185,129,0.12);color:#059669;font-weight:600;">🟢 时间/结构目录（合法同名）</span>':""}
                                    ${s.isContentDivergent?`<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(245,158,11,0.12);color:#d97706;font-weight:600;" title="${v(s.divergenceReason||"")}">💡 路径/内容独立 (建议保留两者)</span>`:""}
                                    ${s.hasEmptyShell?'<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(239,68,68,0.12);color:#ef4444;font-weight:600;">⚪ 含 0 字空壳</span>':""}
                                    ${s.isSuspectedFork?'<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(217,119,6,0.12);color:#d97706;font-weight:600;">⚠️ 疑似版本分叉</span>':""}
                                    ${s.isIgnored?'<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(100,116,139,0.12);color:#475569;font-weight:600;">🛡️ 已加白名单</span>':""}
                                </div>
                                <div style="display:flex;gap:4px;align-items:center;flex-shrink:0;flex-wrap:wrap;">
                                    <button type="button" class="lv-qw-tag-chip lv-group-diff-btn" data-group-index="${I}" data-drawer-id="${B}" data-group-title="${v(s.title)}" style="padding:2px 8px;font-size:10.5px;color:var(--lv-lp-accent);background:var(--lv-lp-accent-soft);border:1px solid var(--lv-lp-border);">⚖️ 双栏对比</button>
                                    <button type="button" class="lv-qw-tag-chip lv-group-ai-judge-btn" data-group-index="${I}" data-drawer-id="${B}" data-group-title="${v(s.title)}" style="padding:2px 8px;font-size:10.5px;color:#7c3aed;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.25);font-weight:700;" title="调动 AI 深入分析语义关系并给出可一键采纳的处置方案">🤖 AI 研判</button>
                                    ${s.isIgnored?`
                                        <button type="button" class="lv-qw-tag-chip lv-toggle-whitelist-group-btn" data-group-index="${I}" data-group-title="${v(s.title)}" data-action="remove" style="padding:2px 8px;font-size:10.5px;color:#64748b;">↩️ 移出白名单</button>
                                    `:`
                                        <button type="button" class="lv-qw-tag-chip lv-toggle-whitelist-group-btn" data-group-index="${I}" data-group-title="${v(s.title)}" data-action="add" style="padding:2px 8px;font-size:10.5px;color:#475569;" title="将本组加入白名单，后续体检不再提示同名">🛡️ 保持现状(忽略)</button>
                                    `}
                                    ${k.length>0?`
                                        <button type="button" class="lv-qw-tag-chip lv-clean-group-empty-btn" data-group-index="${I}" data-group-title="${v(s.title)}" style="padding:2px 8px;font-size:10.5px;color:#ef4444;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);font-weight:700;">⚪ 清理本组空壳</button>
                                    `:""}
                                    ${s.isBenign?"":`<button type="button" class="lv-qw-tag-chip lv-group-recycle-btn" data-group-index="${I}" data-group-title="${v(s.title)}" style="padding:2px 8px;font-size:10.5px;color:#ef4444;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);">🧹 清理本组副本</button>`}
                                </div>
                            </div>
                            <div class="lv-diff-drawer-${B}" style="display:none;padding:10px;border-radius:8px;background:var(--lv-lp-card-bg,#fff);border:1px dashed var(--lv-lp-accent);font-size:11px;"></div>
                            <div class="lv-ai-drawer-${B}" style="display:none;padding:10px 12px;border-radius:8px;background:var(--lv-lp-card-bg,#fff);border:1px solid rgba(124,58,237,0.3);font-size:11px;box-shadow:0 2px 10px rgba(124,58,237,0.06);"></div>
                            <div style="display:flex;flex-direction:column;gap:5px;">
                                ${s.docs.map($=>{let O=$.id===s.recommendedKeepId,Z=$.length===0&&($.childCount||0)===0;return`
                                        <div class="lv-doc-entry-row" data-doc-id="${$.id}" data-doc-box="${$.box}" style="display:flex;flex-direction:column;padding:6px 9px;border-radius:6px;background:var(--lv-lp-card-bg,#fff);border:1px solid ${O&&!s.isBenign?"#10b981":"var(--lv-lp-border)"};font-size:11px;">
                                            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;">
                                                <div style="flex:1;min-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                                    ${s.isBenign?'<span style="color:#059669;font-weight:600;margin-right:4px;">[📁 目录节点]</span>':O?'<span style="color:#10b981;font-weight:700;margin-right:4px;">[🌟 推荐真身]</span>':'<span style="color:#94a3b8;margin-right:4px;">[副本]</span>'}
                                                    <span style="opacity:.85;font-weight:600;" title="${v($.hpath)}">${v($.hpath||"/"+$.id)}</span>
                                                    <span style="opacity:.55;margin-left:6px;font-size:10.5px;">(${$.length} 字 · ${sn($.updated)})</span>
                                                    ${Z?'<span style="font-size:10px;padding:1px 5px;border-radius:4px;background:rgba(239,68,68,0.12);color:#ef4444;font-weight:700;margin-left:4px;" title="此文档内容为 0 字且无子文档，属于误建空壳">⚪ 0字空壳</span>':""}
                                                    ${($.childCount||0)>0?`<span style="font-size:10px;padding:1px 5px;border-radius:4px;background:rgba(245,158,11,0.12);color:#d97706;font-weight:600;margin-left:4px;" title="此文档下含有 ${$.childCount} 篇子文档，移入回收站将同时级联移动！">📁 含 ${$.childCount} 篇子文档</span>`:""}
                                                </div>
                                                <div style="display:flex;gap:4px;flex-shrink:0;">
                                                    ${!O&&!s.isBenign?`<button type="button" class="lv-qw-tag-chip lv-set-keep-btn" data-group-index="${I}" data-group-title="${v(s.title)}" data-doc-id="${$.id}" style="padding:2px 6px;font-size:10px;color:var(--lv-lp-accent);">设为真身</button>`:""}
                                                    <button type="button" class="lv-qw-tag-chip lv-rename-doc-btn" data-doc-id="${$.id}" data-doc-box="${$.box}" data-doc-title="${v(s.title)}" style="padding:2px 6px;font-size:10px;color:#475569;" title="重命名此文档标题以消除同名混淆">✏️ 改名</button>
                                                    <button type="button" class="lv-qw-tag-chip lv-doc-snippet-btn" data-doc-id="${$.id}" style="padding:2px 7px;font-size:10.5px;">👁 摘要</button>
                                                    <button type="button" class="lv-qw-tag-chip lv-doc-jump-btn" data-doc-id="${$.id}" style="padding:2px 7px;font-size:10.5px;">打开</button>
                                                    <button type="button" class="lv-qw-tag-chip lv-doc-more-btn" data-doc-id="${$.id}" data-doc-box="${$.box}" style="padding:2px 6px;font-size:11px;" title="思源原生菜单 (右键/重命名/移动/历史/导出)">⋯</button>
                                                    ${s.isBenign?"":`<button type="button" class="lv-qw-tag-chip lv-doc-recycle-btn" data-doc-id="${$.id}" data-doc-box="${$.box}" data-child-count="${$.childCount||0}" data-doc-title="${v(s.title)}" style="padding:2px 7px;font-size:10.5px;color:#ef4444;">移入回收站</button>`}
                                                </div>
                                            </div>
                                            <div class="lv-snippet-drawer-${$.id}" style="display:none;margin-top:5px;padding:5px 8px;border-radius:4px;background:rgba(15,23,42,0.03);font-size:10.5px;color:var(--lv-lp-text-sub,#64748b);border-left:2px solid var(--lv-lp-accent);word-break:break-all;"></div>
                                        </div>
                                    `}).join("")}
                            </div>
                        </div>
                    `}).join("")}
            `;let F=re.querySelector(".lv-dup-search-input");F&&F.addEventListener("input",()=>{a=F.value,U();let s=re.querySelector(".lv-dup-search-input");s&&(s.focus(),s.setSelectionRange(s.value.length,s.value.length))})}else if(t==="sync-conflict")re.innerHTML=`
                <div class="lv-restore-warn" style="font-size:11px;margin-bottom:6px;">
                    💡 多端并发记事时，两端生成的 Block ID 独立，思源三向合并会自动保留双方内容，偶发重复追加。小驴对账中枢可在毫秒级定位分叉，支持增量合并与智能规范改名。
                </div>
                <div style="padding:10px 12px;border-radius:9px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);display:flex;flex-direction:column;gap:6px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
                        <strong>1. 同步冲突分叉文档 (Conflict Docs)</strong>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-weight:600;color:${o.length>0?"#ef4444":"#10b981"};">${o.length>0?`⚠️ 发现 ${o.length} 篇`:"✓ 无冲突"}</span>
                            ${o.length>0?'<button type="button" class="lv-qw-tag-chip lv-recycle-all-conflicts-btn" style="padding:2px 8px;font-size:10.5px;color:#ef4444;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);">🧹 清理所有冲突分叉</button>':""}
                        </div>
                    </div>
                    ${o.length===0?`
                        <div style="font-size:11px;color:#10b981;">✓ 全库未检测到因同步分叉生成的带 (冲突) 后缀文档。</div>
                    `:`
                        <div style="display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto;">
                            ${o.map(b=>{let K=cn.judgeConflictPair(b);return`
                                <div class="lv-doc-entry-row" data-doc-id="${b.id}" data-doc-box="${b.box}" style="display:flex;flex-direction:column;gap:4px;padding:6px 9px;border-radius:6px;background:var(--lv-lp-card-bg,#fff);border:1px solid rgba(239,68,68,0.25);font-size:11px;">
                                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;">
                                        <div style="flex:1;min-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                            <span style="color:#ef4444;font-weight:700;">[⚡ 冲突版]</span>
                                            <span style="opacity:.85;font-weight:600;" title="${v(b.title)}">${v(b.title)}</span>
                                            <span style="opacity:.5;margin-left:6px;font-size:10.5px;">(${b.length||0} 字 · ${sn(b.updated)})</span>
                                        </div>
                                        <div style="display:flex;gap:4px;flex-shrink:0;">
                                            ${b.baseDocId?`
                                                <button type="button" class="lv-qw-tag-chip lv-conflict-merge-btn" data-conflict-id="${b.id}" data-base-id="${b.baseDocId}" style="padding:2px 8px;font-size:10.5px;color:#2563eb;background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.25);font-weight:700;">🔄 增量合并进原件</button>
                                            `:""}
                                            <button type="button" class="lv-qw-tag-chip lv-conflict-rename-btn" data-doc-id="${b.id}" data-doc-box="${b.box}" data-suggested-title="${v(K.suggestedTitle)}" style="padding:2px 7px;font-size:10.5px;color:#475569;">✏️ 规范改名</button>
                                            <button type="button" class="lv-qw-tag-chip lv-doc-jump-btn" data-doc-id="${b.id}" style="padding:2px 7px;font-size:10.5px;">打开对比</button>
                                            <button type="button" class="lv-qw-tag-chip lv-doc-more-btn" data-doc-id="${b.id}" data-doc-box="${b.box}" style="padding:2px 6px;font-size:11px;" title="思源原生菜单">⋯</button>
                                            <button type="button" class="lv-qw-tag-chip lv-doc-recycle-btn" data-doc-id="${b.id}" data-doc-box="${b.box}" style="padding:2px 7px;font-size:10.5px;color:#ef4444;">移入回收站</button>
                                        </div>
                                    </div>
                                    ${b.baseDocId?`
                                        <div style="font-size:10.5px;padding:3px 6px;border-radius:4px;background:rgba(16,185,129,0.06);color:#059669;display:flex;align-items:center;gap:6px;">
                                            <span>✓ 已匹配原件真身：《${v(b.baseDocTitle||"")}》(${b.baseDocLength||0}字 · \`${v(b.baseDocHPath||"")}\`)</span>
                                            <button type="button" class="lv-qw-tag-chip lv-doc-jump-btn" data-doc-id="${b.baseDocId}" style="padding:1px 5px;font-size:9.5px;">打开原件</button>
                                        </div>
                                    `:`
                                        <div style="font-size:10px;color:var(--lv-lp-text-sub);">ℹ️ 全库未检索到同名原件文档（可能已被移动或改名），建议人工查阅</div>
                                    `}
                                    <div style="font-size:10px;padding:3px 6px;border-radius:4px;background:rgba(124,58,237,0.06);color:#6d28d9;">
                                        🤖 <strong>AI 参谋建议：</strong>${v(K.recommendation)}
                                    </div>
                                </div>
                            `}).join("")}
                        </div>
                    `}
                </div>
                <div style="padding:10px 12px;border-radius:9px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);display:flex;flex-direction:column;gap:6px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
                        <strong>2. 跨笔记本分立孤立日记 (Orphan Daily Notes)</strong>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-weight:600;color:${c.length>0?"#f59e0b":"#10b981"};">${c.length>0?`⚠️ 发现 ${c.length} 篇分立日记`:"✓ 无孤立日记"}</span>
                            ${c.length>1?'<button type="button" class="lv-qw-tag-chip lv-batch-merge-orphans-btn" style="padding:2px 8px;font-size:10.5px;color:#2563eb;background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.25);font-weight:700;">🔄 一键归并所有孤立日记</button>':""}
                        </div>
                    </div>
                    ${c.length===0?`
                        <div style="font-size:11px;color:#10b981;">✓ 全生态日记路径规范，无误建在插件专属本的孤立日记。</div>
                    `:`
                        <div style="display:flex;flex-direction:column;gap:5px;max-height:200px;overflow-y:auto;">
                            ${c.map(b=>{let K=cn.judgeOrphanDailyNote(b);return`
                                <div style="display:flex;flex-direction:column;gap:4px;padding:6px 8px;border-radius:6px;background:var(--lv-lp-card-bg,#fff);border:1px solid rgba(245,158,11,0.25);font-size:11px;">
                                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
                                        <div style="display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:70%;">
                                            <span style="font-weight:700;color:#d97706;">📅 ${v(b.date)}</span>
                                            <span style="font-size:10px;padding:1px 5px;border-radius:4px;background:rgba(100,116,139,0.12);color:#475569;">${v(b.boxName)}</span>
                                            ${b.isEmpty?'<span style="font-size:10px;color:#94a3b8;">(0字空占位)</span>':`<span style="font-size:10px;color:#059669;font-weight:600;">(含 ${b.pendingBlocksCount||1} 笔流水 · ${b.length}字)</span>`}
                                        </div>
                                        <div style="display:flex;gap:4px;flex-shrink:0;">
                                            <button type="button" class="lv-qw-tag-chip lv-doc-jump-btn" data-doc-id="${b.id}" style="padding:1px 5px;font-size:10px;">打开</button>
                                            <button type="button" class="lv-qw-tag-chip lv-merge-orphan-daily-btn" data-orphan-id="${b.id}" style="padding:2px 8px;font-size:10.5px;color:#2563eb;background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.25);font-weight:700;">${b.isEmpty?"🧹 清理空占位":"🔄 一键合并进主日记"}</button>
                                        </div>
                                    </div>
                                    <div style="font-size:10.5px;color:var(--lv-lp-text-sub);background:rgba(15,23,42,0.02);padding:4px 6px;border-radius:4px;word-break:break-all;">
                                        ${v(b.snippet)}
                                    </div>
                                    <div style="font-size:10px;padding:3px 6px;border-radius:4px;background:rgba(124,58,237,0.06);color:#6d28d9;">
                                        🤖 <strong>AI 参谋建议：</strong>${v(K.recommendation)}
                                    </div>
                                    <div style="font-size:10px;color:${b.mainDocId?"#10b981":"#64748b"};display:flex;align-items:center;gap:4px;">
                                        ${b.mainDocId?`✓ 对应主日记已就绪 (${b.mainDocLength||0}字)`:"ℹ️ 主日记尚未生成（合并时将自动初始化主日记）"}
                                    </div>
                                </div>
                            `}).join("")}
                        </div>
                    `}
                </div>
                <div style="padding:10px 12px;border-radius:9px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);display:flex;flex-direction:column;gap:6px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <strong>3. 今日日记重复 LifeLog 流水</strong>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-weight:600;color:${r.duplicateGroups>0?"#f59e0b":"#10b981"};">${r.duplicateGroups>0?`⚠️ 发现 ${r.duplicateGroups} 组重复`:"✓ 无重复"}</span>
                            ${r.duplicateGroups>0?'<button type="button" class="lv-qw-tag-chip lv-clean-lifelog-btn" style="padding:2px 8px;font-size:10.5px;color:var(--lv-lp-accent);background:var(--lv-lp-accent-soft);border:1px solid var(--lv-lp-border);">🧹 清洗重复流水</button>':""}
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--lv-lp-text-sub);">${r.duplicateGroups>0?`重复流水：${r.details.join("；")}`:"今日日记各端记事顺序唯一，无时间戳或内容重复块。"}</div>
                </div>
                <div style="padding:10px 12px;border-radius:9px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);display:flex;flex-direction:column;gap:6px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <strong>4. 读库重复网页剪藏 (Duplicate Clips)</strong>
                        <span style="font-weight:600;color:${l.length>0?"#f59e0b":"#10b981"};">${l.length>0?`⚠️ 发现 ${l.length} 组重复`:"✓ 无重复"}</span>
                    </div>
                    ${l.length===0?`
                        <div style="font-size:11px;color:#10b981;">✓ 读库文章 URL 指纹唯一，无多端重复剪藏收录。</div>
                    `:`
                        <div style="display:flex;flex-direction:column;gap:4px;max-height:160px;overflow-y:auto;">
                            ${l.map(b=>`
                                <div style="display:flex;flex-direction:column;gap:4px;padding:6px 8px;border-radius:5px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border);font-size:11px;">
                                    <div style="display:flex;justify-content:space-between;align-items:center;">
                                        <span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:70%;" title="${v(b.url)}">🌐 ${v(b.url)}</span>
                                        <button type="button" class="lv-qw-tag-chip lv-recycle-clip-group-btn" data-clip-url="${v(b.url)}" style="padding:2px 7px;font-size:10px;color:#ef4444;">清理冗余剪藏</button>
                                    </div>
                                    <div style="display:flex;flex-direction:column;gap:2px;">
                                        ${(b.docs||[]).map((K,ue)=>`
                                            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 6px;border-radius:4px;background:rgba(15,23,42,0.02);font-size:10.5px;">
                                                <span style="opacity:.85;">${ue===0?"[🌟 推荐保留] ":"[副本] "}《${v(K.title)}》</span>
                                                <div style="display:flex;gap:4px;">
                                                    <button type="button" class="lv-qw-tag-chip lv-doc-jump-btn" data-doc-id="${K.id}" style="padding:1px 5px;font-size:10px;">打开</button>
                                                    ${ue>0?`<button type="button" class="lv-qw-tag-chip lv-doc-recycle-btn" data-doc-id="${K.id}" data-doc-box="${K.box}" style="padding:1px 5px;font-size:10px;color:#ef4444;">移入回收站</button>`:""}
                                                </div>
                                            </div>
                                        `).join("")}
                                    </div>
                                </div>
                            `).join("")}
                        </div>
                    `}
                </div>
            `;else if(t==="doc-blocks"){if(!y?.id){re.innerHTML=`
                    <div style="text-align:center;padding:36px 16px;color:var(--lv-lp-text-sub,#64748b);">
                        💡 请先在思源笔记中打开需要排重的长文档，然后再次点击查重对账。<br>
                        <span style="font-size:11px;opacity:.75;margin-top:6px;display:inline-block;">支持扫描长文内重复粘贴的段落、列表、代码块并一键保留首块。</span>
                    </div>
                `;return}if(i.length===0){re.innerHTML=`
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;padding:6px 10px;border-radius:6px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);font-size:11px;">
                        <span style="color:var(--lv-lp-text-sub);">排重敏感度：</span>
                        <div style="display:flex;gap:4px;">
                            <button type="button" class="lv-qw-tag-chip lv-min-len-btn ${d===6?"active":""}" data-len="6" style="padding:2px 7px;font-size:10.5px;${d===6?"font-weight:700;color:var(--lv-lp-accent);background:var(--lv-lp-accent-soft);border-color:var(--lv-lp-accent);":""}">≥6字 (默认)</button>
                            <button type="button" class="lv-qw-tag-chip lv-min-len-btn ${d===15?"active":""}" data-len="15" style="padding:2px 7px;font-size:10.5px;${d===15?"font-weight:700;color:var(--lv-lp-accent);background:var(--lv-lp-accent-soft);border-color:var(--lv-lp-accent);":""}">≥15字 (长句)</button>
                            <button type="button" class="lv-qw-tag-chip lv-min-len-btn ${d===30?"active":""}" data-len="30" style="padding:2px 7px;font-size:10.5px;${d===30?"font-weight:700;color:var(--lv-lp-accent);background:var(--lv-lp-accent-soft);border-color:var(--lv-lp-accent);":""}">≥30字 (段落)</button>
                        </div>
                    </div>
                    <div style="padding:10px 12px;border-radius:8px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);margin-bottom:8px;">
                        当前聚焦文档：<strong>《${v(y.title)}》</strong>
                    </div>
                    <div style="text-align:center;padding:28px 16px;color:#10b981;font-weight:600;">
                        🎉 文档内容健康度极佳！未检测到任何重复粘贴的段落或列表块（阈值 ≥${d}字）。
                    </div>
                `;return}re.innerHTML=`
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;padding:6px 10px;border-radius:6px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);font-size:11px;">
                    <span style="color:var(--lv-lp-text-sub);">排重敏感度：</span>
                    <div style="display:flex;gap:4px;">
                        <button type="button" class="lv-qw-tag-chip lv-min-len-btn ${d===6?"active":""}" data-len="6" style="padding:2px 7px;font-size:10.5px;${d===6?"font-weight:700;color:var(--lv-lp-accent);background:var(--lv-lp-accent-soft);border-color:var(--lv-lp-accent);":""}">≥6字 (默认)</button>
                        <button type="button" class="lv-qw-tag-chip lv-min-len-btn ${d===15?"active":""}" data-len="15" style="padding:2px 7px;font-size:10.5px;${d===15?"font-weight:700;color:var(--lv-lp-accent);background:var(--lv-lp-accent-soft);border-color:var(--lv-lp-accent);":""}">≥15字 (长句)</button>
                        <button type="button" class="lv-qw-tag-chip lv-min-len-btn ${d===30?"active":""}" data-len="30" style="padding:2px 7px;font-size:10.5px;${d===30?"font-weight:700;color:var(--lv-lp-accent);background:var(--lv-lp-accent-soft);border-color:var(--lv-lp-accent);":""}">≥30字 (段落)</button>
                    </div>
                </div>
                <div style="padding:8px 12px;border-radius:8px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);font-size:11.5px;">
                    目标文档：<strong>《${v(y.title)}》</strong> · 发现 <strong>${i.length}</strong> 组重复块（预计可精简 <strong>${i.reduce((b,K)=>b+(K.blockIds.length-1),0)}</strong> 处冗余，约 <strong>${i.reduce((b,K)=>b+(K.blockIds.length-1)*K.content.length,0)}</strong> 字）：
                </div>
                ${i.map(b=>`
                    <div style="padding:8px 10px;border-radius:8px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);font-size:11px;display:flex;flex-direction:column;gap:5px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="color:var(--lv-lp-accent);font-weight:600;">${Uo(b.type)} · 重复出现 ${b.count} 次</span>
                            <div style="display:flex;gap:4px;">
                                <button type="button" class="lv-qw-tag-chip lv-block-single-dedup-btn" data-block-ids="${b.blockIds.join(",")}" style="padding:2px 8px;font-size:10.5px;color:var(--lv-lp-accent);">🧹 单组排重</button>
                                <button type="button" class="lv-qw-tag-chip lv-block-locate-btn" data-block-id="${b.blockIds[0]}" data-root-id="${y.id}" style="padding:2px 7px;font-size:10.5px;">定位高亮</button>
                            </div>
                        </div>
                        <div style="background:var(--lv-lp-card-bg);padding:6px 8px;border-radius:5px;border:1px solid var(--lv-lp-border);word-break:break-all;color:var(--lv-lp-text);font-family:monospace;font-size:10.5px;">
                            ${v(b.content.slice(0,160))}${b.content.length>160?"…":""}
                        </div>
                    </div>
                `).join("")}
            `}else{let b=Array.from(Un());re.innerHTML=`
                <div class="lv-restore-warn" style="font-size:11px;margin-bottom:8px;">
                    🛡️ 白名单中的同名文档组在全库体检中将保持现状并自动隐去，避免反复打扰。您可随时按需将其移出白名单恢复日常审计。
                </div>
                ${b.length===0?`
                    <div style="text-align:center;padding:36px 16px;color:var(--lv-lp-text-sub,#64748b);">
                        暂无白名单记录。在「全库同名文档」列表中点击【🛡️ 保持现状(忽略)】可将合法同名项加入此处。
                    </div>
                `:`
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;">
                            <span style="font-size:11.5px;font-weight:600;">当前已忽略同名文档 (${b.length} 个标题)：</span>
                            <button type="button" class="lv-qw-tag-chip lv-clear-whitelist-btn" style="padding:2px 8px;font-size:10.5px;color:#ef4444;">清空白名单</button>
                        </div>
                        ${b.map(K=>`
                            <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:6px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);font-size:11px;">
                                <div style="display:flex;align-items:center;gap:6px;">
                                    <span style="color:#059669;font-weight:700;">🛡️ 《${v(K)}》</span>
                                    <span style="font-size:10px;color:var(--lv-lp-text-sub);">已设为免打扰</span>
                                </div>
                                <button type="button" class="lv-qw-tag-chip lv-whitelist-remove-item-btn" data-title="${v(K)}" style="padding:2px 7px;font-size:10px;color:#64748b;">移出白名单</button>
                            </div>
                        `).join("")}
                    </div>
                `}
            `}},de=async()=>{re&&(re.innerHTML='<div style="text-align:center;padding:32px;color:var(--lv-lp-accent);">🔍 正在全景分析思源全库文档与段落…</div>',e=await ke.scanDuplicateDocTitles(),o=await ke.scanConflictDocs(),r=await ke.deduplicateDailyLifeLogs(void 0,!0),l=await ke.findDuplicateClips(),c=await ke.scanOrphanDailyNotes(),y?.id&&(i=await ke.scanDocDuplicateBlocks(y.id,d)),U())},J=b=>{if(!b)return;let K=b.getAttribute("data-group-index");if(K!==null){let ge=Number(K);if(!isNaN(ge)&&ge>=0&&ge<n.length)return n[ge]}let ue=b.getAttribute("data-group-title");if(ue)return n.find(ge=>ge.title===ue)||e.find(ge=>ge.title===ue)},le=async(b,K,ue,ge)=>{let z=K.docs.find(O=>O.id===K.recommendedKeepId)||K.docs[0];if(!z){b.style.display="none";return}let G=K.docs.filter(O=>O.id!==z.id),F=(ge?G.find(O=>O.id===ge):null)||G[0]||K.docs[1]||z;b.innerHTML=`
            <div style="text-align:center;padding:16px;color:var(--lv-lp-accent,#2563eb);display:flex;align-items:center;justify-content:center;gap:6px;">
                <span>⏳</span>
                <span>正在块级拉取两篇文档正文并进行 LCS 差异对账比对…</span>
            </div>
        `;let[s,I]=await Promise.all([ke.getDocContentBlocks(z.id,200),ke.getDocContentBlocks(F.id,200)]),B=qn(s,I),k=n.indexOf(K),$=G.length>1?`
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);">对比副本:</span>
                <select class="lv-diff-cand-select" data-group-index="${k}" data-drawer-id="${ue}" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.15));padding:2px 6px;border-radius:4px;font-size:11px;color:var(--lv-lp-text,#0f172a);cursor:pointer;max-width:200px;">
                    ${G.map(O=>`<option value="${O.id}" ${O.id===F.id?"selected":""}>${v(O.hpath||O.id)} (${O.length}字)</option>`).join("")}
                </select>
            </div>
        `:"";b.innerHTML=`
            <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;padding-bottom:6px;border-bottom:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        <span style="font-weight:700;font-size:12px;color:var(--lv-lp-text);">⚖️ 《${v(K.title)}》 差异对账 (LCS 块级比对)</span>
                        <span style="font-size:10.5px;padding:1px 6px;border-radius:4px;background:rgba(37,99,235,0.08);color:var(--lv-lp-accent,#2563eb);font-weight:600;">相似度: ${B.similarityPercent}%</span>
                        <span style="font-size:10.5px;padding:1px 6px;border-radius:4px;background:rgba(16,185,129,0.1);color:#059669;font-weight:600;">🟢 真身独有 ${B.uniqueCountA} 块 (${B.uniqueWordsA}字)</span>
                        <span style="font-size:10.5px;padding:1px 6px;border-radius:4px;background:rgba(245,158,11,0.1);color:#d97706;font-weight:600;">🟠 副本独有 ${B.uniqueCountB} 块 (${B.uniqueWordsB}字)</span>
                        <span style="font-size:10.5px;padding:1px 6px;border-radius:4px;background:rgba(15,23,42,0.05);color:var(--lv-lp-text-sub,#64748b);">⚪ 相同 ${B.identicalCount} 块</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        ${$}
                        <button type="button" class="lv-qw-tag-chip lv-close-diff-drawer-btn" data-drawer-id="${ue}" style="padding:1px 7px;font-size:10.5px;">收起</button>
                    </div>
                </div>

                <div class="lv-diff-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <div style="padding:6px 8px;border-radius:6px;background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.25);">
                        <div style="display:flex;align-items:center;justify-content:space-between;">
                            <strong style="color:#059669;font-size:11.5px;">🌟 推荐真身 (${z.length} 字 · ${s.length} 块)</strong>
                            <div style="display:flex;gap:4px;">
                                <button type="button" class="lv-qw-tag-chip lv-doc-jump-btn" data-doc-id="${z.id}" style="padding:1px 5px;font-size:10px;">打开</button>
                                <button type="button" class="lv-qw-tag-chip lv-doc-more-btn" data-doc-id="${z.id}" data-doc-box="${z.box}" style="padding:1px 5px;font-size:10px;" title="原生菜单">⋯</button>
                            </div>
                        </div>
                        <div style="font-size:10px;color:var(--lv-lp-text-sub,#64748b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;" title="${v(z.hpath)}">${v(z.hpath||"/"+z.id)}</div>
                    </div>
                    <div style="padding:6px 8px;border-radius:6px;background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.25);">
                        <div style="display:flex;align-items:center;justify-content:space-between;">
                            <strong style="color:#d97706;font-size:11.5px;">📑 候选副本 (${F.length} 字 · ${I.length} 块)</strong>
                            <div style="display:flex;gap:4px;">
                                <button type="button" class="lv-qw-tag-chip lv-doc-jump-btn" data-doc-id="${F.id}" style="padding:1px 5px;font-size:10px;">打开</button>
                                <button type="button" class="lv-qw-tag-chip lv-doc-more-btn" data-doc-id="${F.id}" data-doc-box="${F.box}" style="padding:1px 5px;font-size:10px;" title="原生菜单">⋯</button>
                            </div>
                        </div>
                        <div style="font-size:10px;color:var(--lv-lp-text-sub,#64748b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;" title="${v(F.hpath)}">${v(F.hpath||"/"+F.id)}</div>
                    </div>
                </div>

                <div class="lv-diff-rows-container" style="max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;padding:6px;background:rgba(15,23,42,0.02);border-radius:6px;border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));font-size:11px;">
                    ${B.rows.length===0?`
                        <div style="text-align:center;padding:16px;color:var(--lv-lp-text-sub,#64748b);">两篇文档当前均暂无正文段落（或均为 0 字空壳）</div>
                    `:B.rows.map(O=>O.type==="identical"?`
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:3px 6px;border-radius:4px;background:rgba(15,23,42,0.02);opacity:0.65;font-size:10.5px;">
                                    <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${v(O.blockA.content)}"><span style="color:#64748b;">[相同]</span> ${v(O.blockA.content)}</div>
                                    <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${v(O.blockB.content)}"><span style="color:#64748b;">[相同]</span> ${v(O.blockB.content)}</div>
                                </div>
                            `:O.type==="diff"?`
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:4px 6px;border-radius:4px;background:rgba(15,23,42,0.03);">
                                    <div style="padding:4px 6px;border-radius:4px;background:rgba(239,68,68,0.06);border-left:2px solid #ef4444;line-height:1.45;word-break:break-all;">
                                        <div style="font-size:9.5px;color:#ef4444;font-weight:700;margin-bottom:2px;">真身原段 (${O.blockA.type})</div>
                                        ${O.blockA.diffHtml||v(O.blockA.content)}
                                    </div>
                                    <div style="padding:4px 6px;border-radius:4px;background:rgba(16,185,129,0.06);border-left:2px solid #10b981;line-height:1.45;word-break:break-all;">
                                        <div style="font-size:9.5px;color:#059669;font-weight:700;margin-bottom:2px;">副本修改 (${O.blockB.type})</div>
                                        ${O.blockB.diffHtml||v(O.blockB.content)}
                                    </div>
                                </div>
                            `:O.type==="unique_a"?`
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:4px 6px;border-radius:4px;background:rgba(15,23,42,0.03);">
                                    <div style="padding:4px 6px;border-radius:4px;background:rgba(16,185,129,0.06);border-left:2px solid #10b981;line-height:1.45;word-break:break-all;">
                                        <div style="font-size:9.5px;color:#059669;font-weight:700;margin-bottom:2px;">+ 仅真身含有 (${O.blockA.type})</div>
                                        ${v(O.blockA.content)}
                                    </div>
                                    <div style="padding:6px;color:var(--lv-lp-text-sub,#64748b);font-style:italic;opacity:0.4;display:flex;align-items:center;">(副本缺失此段)</div>
                                </div>
                            `:`
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:4px 6px;border-radius:4px;background:rgba(15,23,42,0.03);">
                                    <div style="padding:6px;color:var(--lv-lp-text-sub,#64748b);font-style:italic;opacity:0.4;display:flex;align-items:center;">(真身缺失此段)</div>
                                    <div style="padding:4px 6px;border-radius:4px;background:rgba(245,158,11,0.06);border-left:2px solid #d97706;line-height:1.45;word-break:break-all;">
                                        <div style="font-size:9.5px;color:#d97706;font-weight:700;margin-bottom:2px;">+ 仅副本含有 (${O.blockB.type})</div>
                                        ${v(O.blockB.content)}
                                    </div>
                                </div>
                            `).join("")}
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;padding-top:4px;border-top:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));flex-wrap:wrap;gap:6px;">
                    <span style="font-size:10.5px;color:var(--lv-lp-text-sub,#64748b);">💡 快捷处置建议：若副本含独有内容，推荐【增量合并】；若属于冗余分叉，可直接【移入回收站】</span>
                    <div style="display:flex;gap:4px;flex-wrap:wrap;">
                        <button type="button" class="lv-qw-tag-chip lv-merge-pair-btn" data-keep-id="${z.id}" data-candidate-id="${F.id}" data-candidate-box="${F.box}" style="padding:3px 10px;font-size:11px;color:#2563eb;background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.25);font-weight:700;">🔄 增量合并进真身</button>
                        <button type="button" class="lv-qw-tag-chip lv-set-keep-btn" data-group-index="${k}" data-group-title="${v(K.title)}" data-doc-id="${F.id}" style="padding:3px 8px;font-size:10.5px;color:var(--lv-lp-accent,#2563eb);">🔄 设为真身</button>
                        <button type="button" class="lv-qw-tag-chip lv-rename-doc-btn" data-doc-id="${F.id}" data-doc-box="${F.box}" data-doc-title="${v(K.title)}" style="padding:3px 8px;font-size:10.5px;color:#475569;">✏️ 改名</button>
                        <button type="button" class="lv-qw-tag-chip lv-doc-recycle-btn" data-doc-id="${F.id}" data-doc-box="${F.box}" data-child-count="${F.childCount||0}" data-doc-title="${v(K.title)}" style="padding:3px 8px;font-size:10.5px;color:#ef4444;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);">🧹 移入回收站</button>
                    </div>
                </div>
            </div>
        `};A?.addEventListener("click",async b=>{let K=b.target?.closest(".lv-conflict-tab");if(K){b.stopPropagation(),oe(6),t=K.getAttribute("data-tab")||"doc-titles",U();return}let ue=b.target?.closest(".lv-reconcile-filter-chip");if(ue){b.stopPropagation(),oe(4),p=ue.getAttribute("data-cat")||"all",U();return}if(b.target?.closest(".lv-ai-health-btn")){if(b.stopPropagation(),oe(6),T=!T,!T&&E){f(),pe();return}if(T&&!S){f();let R=eo();P=R,E=!0,pe(),ke.aiSummarizeVaultHealth({dupDocGroups:e,conflictDocs:o,orphanDailyNotes:c,dupClips:l},{signal:R.signal}).then(ee=>{R.signal.aborted||P!==R||!A?.isConnected||(P=null,j?.destroy(),j=null,S=ee,E=!1,pe())}).catch(()=>{R.signal.aborted||P!==R||(f(),T=!1,pe())})}else pe();return}if(b.target?.closest(".lv-close-health-btn")){b.stopPropagation(),f(),T=!1,pe();return}let G=b.target?.closest(".lv-min-len-btn");if(G){b.stopPropagation(),oe(6),d=Number(G.getAttribute("data-len"))||6,y?.id&&re&&(re.innerHTML=`<div style="text-align:center;padding:32px;color:var(--lv-lp-accent);">🔍 正在按敏感度 ≥${d}字 检索重复块…</div>`,ke.scanDocDuplicateBlocks(y.id,d).then(R=>{i=R,U()}));return}let F=b.target?.closest(".lv-doc-jump-btn");if(F){b.stopPropagation();let R=F.getAttribute("data-doc-id");R&&Ze(R);return}let s=b.target?.closest(".lv-doc-recycle-btn");if(s){b.stopPropagation();let R=s.getAttribute("data-doc-id"),ee=s.getAttribute("data-doc-box"),ie=Number(s.getAttribute("data-child-count")||0);if(ie>0&&typeof q<"u"){let ve=s.getAttribute("data-doc-title")||"该文档";if(!await zt("⚠️ 安全拦截告警",`文档《${ve}》下含有 ${ie} 篇子文档！
移入废纸篓将同时级联移动这 ${ie} 篇子文档。

请确认是否仍要移入回收站？`))return}R&&(oe(8),ke.safeRemoveDocToRecycle(R,ee||void 0).then(ve=>{ve&&(N.capsule({source:"查重对账",message:"✓ 冗余副本已移入废纸篓（可随时撤销还原）",duration:2500,level:"info",archive:!1}),de())}));return}let I=b.target?.closest(".lv-set-keep-btn");if(I){b.stopPropagation(),oe(4);let R=J(I),ee=I.getAttribute("data-doc-id");R&&ee&&(R.recommendedKeepId=ee,U());return}let B=b.target?.closest(".lv-rename-doc-btn");if(B){b.stopPropagation(),oe(4);let R=B.getAttribute("data-doc-id"),ee=B.getAttribute("data-doc-box"),ie=B.getAttribute("data-doc-title")||"";if(R&&typeof q<"u"){let ve=await Bn("✏️ 文档区分改名",`请输入《${ie}》的新标题（消除同名混淆）：`,`${ie} (区分)`);if(ve&&ve.trim()&&ve.trim()!==ie){B.disabled=!0,B.textContent="改名中…";let qe=await ke.renameDoc(R,ve.trim(),ee||void 0);qe.ok?(N.capsule({source:"对账改名",message:`✓ 已成功改名为《${ve.trim()}》`,duration:2500,level:"success",archive:!1}),de()):(B.disabled=!1,B.textContent="✏️ 改名",N.capsule({source:"对账改名",message:`改名失败: ${qe.error||"未知错误"}`,duration:2500,level:"error",archive:!1}))}}return}let k=b.target?.closest(".lv-toggle-whitelist-group-btn");if(k){b.stopPropagation(),oe(6);let R=J(k),ee=R?.title||k.getAttribute("data-group-title"),ie=k.getAttribute("data-action");ee&&(ie==="add"?(Ko(ee),N.capsule({source:"对账白名单",message:`✓ 已将《${ee}》加入白名单`,duration:2200,level:"info",archive:!1})):(Gn(ee),N.capsule({source:"对账白名单",message:`✓ 已将《${ee}》移出白名单`,duration:2200,level:"info",archive:!1})),R&&(R.isIgnored=ie==="add"),U());return}let $=b.target?.closest(".lv-clean-group-empty-btn");if($){b.stopPropagation(),oe(8);let R=J($);if(R){let ee=R.docs.filter(ie=>ie.id!==R.recommendedKeepId&&ie.length===0&&(ie.childCount||0)===0);if(ee.length>0){$.disabled=!0,$.textContent="清理中…";let ie=0,ve=0;for(let Le of ee)await ke.safeRemoveDocToRecycle(Le.id,Le.box)?ie++:ve++;let qe=ve>0?`（${ve} 篇已失效跳过）`:"";N.capsule({source:"查重对账",message:ie>0?`✓ 已清理 ${ie} 篇 0 字空壳副本${qe}`:"本组空壳已不存在或已清理",duration:2500,level:ie>0?"success":"info",archive:!1}),de()}}return}let O=b.target?.closest(".lv-group-diff-btn");if(O){b.stopPropagation(),oe(6);let R=J(O);if(R){let ie=O.getAttribute("data-drawer-id")||v(R.title).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g,"_"),ve=A?.querySelector(`.lv-diff-drawer-${ie}`);if(ve){if(ve.style.display!=="none"){ve.style.display="none";return}ve.style.display="block",le(ve,R,ie)}}return}let Z=b.target?.closest(".lv-merge-pair-btn");if(Z){b.stopPropagation(),oe(8);let R=Z.getAttribute("data-keep-id"),ee=Z.getAttribute("data-candidate-id"),ie=Z.getAttribute("data-candidate-box");if(R&&ee){Z.disabled=!0,Z.textContent="合并中…";let ve=await ke.mergeDocBlocks(R,ee,{recycleSource:!0,sourceBox:ie||void 0});N.capsule({source:"对账合并",message:ve.msg,duration:3500,level:ve.ok?"success":"error",archive:!1}),de()}return}let m=b.target?.closest(".lv-group-ai-judge-btn");if(m){b.stopPropagation(),oe(6);let R=J(m);if(R){let ie=m.getAttribute("data-drawer-id")||v(R.title).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g,"_"),ve=A?.querySelector(`.lv-ai-drawer-${ie}`);if(ve)if(ve.style.display==="none"){let qe=D.get(ie);if(qe){try{qe.ctrl?.abort()}catch{}try{qe.handle?.destroy()}catch{}D.delete(ie)}let Le=R.docs[0],Ce=R.docs[1]||Le;if(!Le||!Ce){ve.style.display="none";return}let _e=eo();ve.style.display="block";let ct=to(ve,{scenario:"doc-judge",compact:!0,title:`🤖 AI 双文档语义研判 · 《${R.title}》`,cancelLabel:"⏹ 取消研判",signal:_e.signal,onCancel:()=>{try{_e.abort(new DOMException("User cancelled","AbortError"))}catch{_e.abort()}D.delete(ie),ct.destroy(),ve.style.display="none"}});D.set(ie,{ctrl:_e,handle:ct}),Promise.all([ke.getDocPreviewSnippet(Le.id,500),ke.getDocPreviewSnippet(Ce.id,500)]).then(async([Lt,On])=>{if(_e.signal.aborted||D.get(ie)?.ctrl!==_e||!ve.isConnected)return;let zo={id:Le.id,title:R.title,box:Le.box,hpath:Le.hpath,updated:Le.updated,length:Le.length,snippet:Lt},No={id:Ce.id,title:R.title,box:Ce.box,hpath:Ce.hpath,updated:Ce.updated,length:Ce.length,snippet:On},Be=await cn.judgeDocPair(zo,No,{signal:_e.signal});_e.signal.aborted||D.get(ie)?.ctrl!==_e||!ve.isConnected||(ct.destroy(),D.delete(ie),ve.innerHTML=`
                                <div style="display:flex;flex-direction:column;gap:8px;">
                                    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(124,58,237,0.15);padding-bottom:6px;">
                                        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                                            <span style="font-weight:700;color:#7c3aed;">🤖 AI 对账智能参谋研判</span>
                                            <span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(124,58,237,0.1);color:#7c3aed;font-weight:600;">${Be.channel==="siyuan"||Be.channel==="siyuan-ai"?"🟢 思源内核智能体":Be.channel==="user_custom"?"🔵 自定义 Key":Be.channel==="ollama"?"🟣 本地 Ollama":Be.channel==="public_free"?"🌐 免费公用通道 (已脱敏)":"⚡ 启发式离线引擎"}${Be.latencyMs?` · ${Be.latencyMs}ms`:""}</span>
                                            ${Be.fallbackTrace?`<span style="font-size:9.5px;padding:1px 5px;border-radius:3px;background:rgba(245,158,11,0.15);color:#d97706;" title="降级链路: ${v(Be.fallbackTrace)}">⚠️ 自动降级</span>`:""}
                                            <span style="font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(15,23,42,0.06);color:var(--lv-lp-text-sub);">相似度: 约 ${Be.similarityPercent}%</span>
                                        </div>
                                        <button type="button" class="lv-qw-tag-chip lv-close-ai-drawer-btn" data-drawer-id="${ie}" style="padding:1px 6px;font-size:10px;">收起</button>
                                    </div>
                                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                                        <div style="padding:6px 8px;border-radius:6px;background:rgba(15,23,42,0.02);border:1px solid var(--lv-lp-border);font-size:10.5px;">
                                            <strong style="color:var(--lv-lp-text);">📄 文档 A (${Le.length}字)</strong>
                                            <div style="color:var(--lv-lp-text-sub);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${v(Le.hpath)}">${v(Le.hpath||"/"+Le.id)}</div>
                                            <div style="margin-top:4px;color:var(--lv-lp-text);font-family:monospace;background:var(--lv-lp-card-bg);padding:4px 6px;border-radius:4px;border:1px solid var(--lv-lp-border);max-height:60px;overflow-y:auto;">${v(Lt||"(无正文)")}</div>
                                        </div>
                                        <div style="padding:6px 8px;border-radius:6px;background:rgba(15,23,42,0.02);border:1px solid var(--lv-lp-border);font-size:10.5px;">
                                            <strong style="color:var(--lv-lp-text);">📄 文档 B (${Ce.length}字)</strong>
                                            <div style="color:var(--lv-lp-text-sub);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${v(Ce.hpath)}">${v(Ce.hpath||"/"+Ce.id)}</div>
                                            <div style="margin-top:4px;color:var(--lv-lp-text);font-family:monospace;background:var(--lv-lp-card-bg);padding:4px 6px;border-radius:4px;border:1px solid var(--lv-lp-border);max-height:60px;overflow-y:auto;">${v(On||"(无正文)")}</div>
                                        </div>
                                    </div>
                                    <div style="padding:8px 10px;border-radius:6px;background:rgba(124,58,237,0.04);border-left:3px solid #7c3aed;font-size:11px;line-height:1.55;color:var(--lv-lp-text);white-space:pre-wrap;">${v(Be.rawMarkdown)}</div>
                                    <div style="display:flex;align-items:center;justify-content:space-between;padding-top:4px;border-top:1px dashed var(--lv-lp-border);flex-wrap:wrap;gap:6px;">
                                        <span style="font-size:10px;color:var(--lv-lp-text-sub);">🔒 决策权 100% 由您掌控：支持一键采纳 AI 方案或手动处置：</span>
                                        <div style="display:flex;gap:4px;flex-wrap:wrap;">
                                            ${Be.suggestedAction==="merge-incremental"?`
                                                <button type="button" class="lv-qw-tag-chip lv-merge-pair-btn" data-keep-id="${Le.id}" data-candidate-id="${Ce.id}" data-candidate-box="${Ce.box}" style="padding:2px 8px;font-size:10.5px;color:#2563eb;background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.25);font-weight:700;">⚡ 采纳 AI：智能合并增量</button>
                                            `:Be.suggestedAction==="keep-second"?`
                                                <button type="button" class="lv-qw-tag-chip lv-doc-recycle-btn" data-doc-id="${Le.id}" data-doc-box="${Le.box}" data-child-count="${Le.childCount||0}" data-doc-title="${v(R.title)}" style="padding:2px 8px;font-size:10.5px;color:#ef4444;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);font-weight:700;">⚡ 采纳 AI：清理空壳 A</button>
                                            `:Be.suggestedAction==="keep-first"?`
                                                <button type="button" class="lv-qw-tag-chip lv-doc-recycle-btn" data-doc-id="${Ce.id}" data-doc-box="${Ce.box}" data-child-count="${Ce.childCount||0}" data-doc-title="${v(R.title)}" style="padding:2px 8px;font-size:10.5px;color:#ef4444;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);font-weight:700;">⚡ 采纳 AI：清理空壳 B</button>
                                            `:Be.suggestedRenameTitle?`
                                                <button type="button" class="lv-qw-tag-chip lv-adopt-rename-btn" data-doc-id="${Ce.id}" data-doc-box="${Ce.box}" data-new-title="${v(Be.suggestedRenameTitle)}" style="padding:2px 8px;font-size:10.5px;color:#059669;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);font-weight:700;">⚡ 采纳 AI：改名《${v(Be.suggestedRenameTitle)}》</button>
                                            `:""}
                                            <button type="button" class="lv-qw-tag-chip lv-toggle-whitelist-group-btn" data-group-title="${v(R.title)}" data-action="add" style="padding:2px 8px;font-size:10.5px;color:#059669;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);font-weight:700;">🟢 保留两者(加白名单)</button>
                                            <button type="button" class="lv-qw-tag-chip lv-doc-recycle-btn" data-doc-id="${Ce.id}" data-doc-box="${Ce.box}" data-child-count="${Ce.childCount||0}" data-doc-title="${v(R.title)}" style="padding:2px 8px;font-size:10.5px;color:#ef4444;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);">仅保留 A (回收 B)</button>
                                            <button type="button" class="lv-qw-tag-chip lv-doc-recycle-btn" data-doc-id="${Le.id}" data-doc-box="${Le.box}" data-child-count="${Le.childCount||0}" data-doc-title="${v(R.title)}" style="padding:2px 8px;font-size:10.5px;color:#ef4444;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);">仅保留 B (回收 A)</button>
                                        </div>
                                    </div>
                                </div>
                            `)}).catch(()=>{_e.signal.aborted||D.get(ie)?.ctrl!==_e||(ct.destroy(),D.delete(ie),ve.style.display="none")})}else{let qe=D.get(ie);if(qe){try{qe.ctrl?.abort()}catch{}try{qe.handle?.destroy()}catch{}D.delete(ie)}ve.style.display="none"}}return}let u=b.target?.closest(".lv-adopt-rename-btn");if(u){b.stopPropagation(),oe(6);let R=u.getAttribute("data-doc-id"),ee=u.getAttribute("data-doc-box"),ie=u.getAttribute("data-new-title");if(R&&ie){u.disabled=!0,u.textContent="改名中…";let ve=await ke.renameDoc(R,ie,ee||void 0);ve.ok?(N.capsule({source:"对账改名",message:`✓ 已成功改名为《${ie}》`,duration:2500,level:"success",archive:!1}),de()):(u.disabled=!1,N.capsule({source:"对账改名",message:`改名失败: ${ve.error||"未知错误"}`,duration:2500,level:"error",archive:!1}))}return}let w=b.target?.closest(".lv-close-ai-drawer-btn");if(w){b.stopPropagation();let R=w.getAttribute("data-drawer-id");if(R){let ee=D.get(R);if(ee){try{ee.ctrl?.abort()}catch{}try{ee.handle?.destroy()}catch{}D.delete(R)}let ie=A?.querySelector(`.lv-ai-drawer-${R}`);ie&&(ie.style.display="none")}return}let x=b.target?.closest(".lv-close-diff-drawer-btn");if(x){b.stopPropagation();let R=x.getAttribute("data-drawer-id");if(R){let ee=A?.querySelector(`.lv-diff-drawer-${R}`);ee&&(ee.style.display="none")}return}let M=b.target?.closest(".lv-group-recycle-btn");if(M){b.stopPropagation();let R=J(M);if(!R){N.capsule({source:"查重对账",message:"未定位到目标文档组，请刷新后重试",duration:2500,level:"warn",archive:!1});return}let ee=R.docs.filter(qe=>qe.id!==R.recommendedKeepId);if(ee.length===0){N.capsule({source:"查重对账",message:"本组仅保留推荐真身，暂无可清理副本",duration:2500,level:"info",archive:!1});return}let ie=ee.reduce((qe,Le)=>qe+(Le.childCount||0),0);if(ie>0&&typeof q<"u"&&!await zt("⚠️ 安全拦截告警",`待清理的副本中含有目录父文档（共含 ${ie} 篇子文档）！
继续清理将一并级联移入废纸篓。

请确认是否继续清理？`))return;oe(8),M.disabled=!0;let ve=M.textContent;M.textContent="清理中…";try{let qe=0,Le=0;for(let Ce of ee)await ke.safeRemoveDocToRecycle(Ce.id,Ce.box)?qe++:Le++;if(qe>0){let Ce=Le>0?`（${Le} 篇已失效跳过）`:"";N.capsule({source:"查重对账",message:`✓ 已将《${R.title}》的 ${qe} 篇副本移入废纸篓${Ce}`,duration:3e3,level:"success",archive:!1})}else N.capsule({source:"查重对账",message:`本组 ${ee.length} 篇副本已不存在或已被其他端清理，无需重复操作`,duration:3e3,level:"info",archive:!1});de()}catch{M.disabled=!1,M.textContent=ve,N.capsule({source:"查重对账",message:"清理副本过程中发生异常，请重试",duration:3e3,level:"error",archive:!1})}return}let _=b.target?.closest(".lv-doc-snippet-btn");if(_){b.stopPropagation();let R=_.getAttribute("data-doc-id");if(R){let ee=A?.querySelector(`.lv-snippet-drawer-${R}`);ee&&(ee.style.display==="none"?(ee.style.display="block",ee.textContent="摘要检索中…",ke.getDocPreviewSnippet(R).then(ie=>{ee.textContent=ie?`📄 正文速览：${ie}`:"（此文档暂无段落正文或为空文档）"})):ee.style.display="none")}return}let W=b.target?.closest(".lv-block-single-dedup-btn");if(W){b.stopPropagation();let R=(W.getAttribute("data-block-ids")||"").split(",").filter(Boolean);y?.id&&R.length>1&&(oe(8),W.textContent="排重中…",ke.deduplicateDocBlocks(y.id,d,R).then(ee=>{N.capsule({source:"段落排重",message:`✓ 已从当前文档剔除 ${ee.removedCount} 处冗余块（保留首块）`,duration:2500,level:"success",archive:!1}),de()}));return}let ce=b.target?.closest(".lv-conflict-merge-btn");if(ce){b.stopPropagation(),oe(8);let R=ce.getAttribute("data-conflict-id"),ee=ce.getAttribute("data-base-id");if(R&&ee){ce.disabled=!0,ce.textContent="合并中…";let ie=await ke.mergeDocBlocks(ee,R,{recycleSource:!0});N.capsule({source:"冲突合并",message:ie.msg,duration:3500,level:ie.ok?"success":"error",archive:!1}),de()}return}let te=b.target?.closest(".lv-conflict-rename-btn");if(te){b.stopPropagation(),oe(4);let R=te.getAttribute("data-doc-id"),ee=te.getAttribute("data-doc-box"),ie=te.getAttribute("data-suggested-title")||"分叉文档";if(R&&typeof q<"u"){let ve=await Bn("✏️ 冲突文档规范改名","请为该冲突文档输入规范名称：",ie);if(ve&&ve.trim()){te.disabled=!0,te.textContent="改名中…";let qe=await ke.renameDoc(R,ve.trim(),ee||void 0);qe.ok?(N.capsule({source:"冲突改名",message:`✓ 已规范改名为《${ve.trim()}》`,duration:2500,level:"success",archive:!1}),de()):(te.disabled=!1,N.capsule({source:"冲突改名",message:`改名失败: ${qe.error||"未知错误"}`,duration:2500,level:"error",archive:!1}))}}return}let ye=b.target?.closest(".lv-recycle-all-conflicts-btn");if(ye){b.stopPropagation(),oe(8),ye.textContent="清理中…",Promise.all(o.map(R=>ke.safeRemoveDocToRecycle(R.id,R.box))).then(R=>{let ee=R.filter(Boolean).length;N.capsule({source:"冲突治理",message:`✓ 已将 ${ee} 篇同步分叉文档移入废纸篓`,duration:2500,level:"success",archive:!1}),de()});return}let V=b.target?.closest(".lv-clean-lifelog-btn");if(V){b.stopPropagation(),oe(8),V.textContent="清洗中…",ke.deduplicateDailyLifeLogs(void 0,!1).then(R=>{N.capsule({source:"日记对账",message:`✓ 已剔除 ${R.removedCount} 条多端重复追加的流水`,duration:2500,level:"success",archive:!1}),de()});return}if(b.target?.closest(".lv-toggle-ignored-filter-btn")){b.stopPropagation(),oe(4),h=!h,U();return}let Ie=b.target?.closest(".lv-export-audit-btn");if(Ie){b.stopPropagation(),oe(8),Ie.textContent="生成中…";let R=ke.generateAuditReportMarkdown({dupDocGroups:e,conflictDocs:o,dupLifeLogState:r,dupClips:l,currentDoc:y?{id:y.id,title:y.title}:void 0,docDupBlocks:i});try{typeof Ue<"u"&&Ue.clipboard&&Ue.clipboard.writeText(R)}catch{}ke.saveAuditReportToHub(R).then(ee=>{Ie.textContent="📄 导出对账单",ee.ok?N.card({title:"📄 对账审计单已生成并安全归档",message:`全库对账报告已复制至剪贴板，并安全归档至「🐴 小驴生态${ee.path}」！`,actions:[{label:"打开对账文档",primary:!0,onClick:()=>{ee.docId&&Ze(ee.docId)}}],level:"success",duration:6500}):N.capsule({source:"对账审计",message:"✓ 全库对账报告已复制至剪贴板（Markdown）",duration:3200,level:"success"})});return}let He=b.target?.closest(".lv-block-locate-btn");if(He){b.stopPropagation(),oe(6);let R=He.getAttribute("data-block-id"),ee=He.getAttribute("data-root-id");R&&(sa(R,ee||void 0),N.capsule({source:"定位高亮",message:"已在编辑器高亮聚焦首块位置",duration:2e3,level:"info",archive:!1}));return}if(b.target?.closest(".lv-toggle-benign-filter-btn")){b.stopPropagation(),oe(6),g=!g,U();return}let me=b.target?.closest(".lv-merge-orphan-daily-btn");if(me){b.stopPropagation();let R=me.getAttribute("data-orphan-id");R&&(oe(8),me.disabled=!0,me.textContent="处理中…",ke.mergeOrphanDailyNote(R).then(ee=>{N.capsule({source:"日记对账",message:ee.msg,duration:3500,level:ee.ok?"success":"error",archive:!1}),de()}));return}let Te=b.target?.closest(".lv-batch-merge-orphans-btn");if(Te){b.stopPropagation(),oe(8),Te.disabled=!0,Te.textContent="批量归并中…";let R=await ke.batchMergeOrphanDailyNotes();N.capsule({source:"日记对账",message:`✓ 批量治理完成：已归并 ${R.mergedTotal} 条流水，清理 ${R.cleanedTotal} 篇孤立文档`,duration:3800,level:"success",archive:!1}),de();return}let be=b.target?.closest(".lv-whitelist-remove-item-btn");if(be){b.stopPropagation(),oe(6);let R=be.getAttribute("data-title");R&&(Gn(R),N.capsule({source:"白名单",message:`✓ 已将《${R}》移出白名单`,duration:2e3,level:"info",archive:!1}),U());return}if(b.target?.closest(".lv-clear-whitelist-btn")){b.stopPropagation(),oe(8),typeof q<"u"&&await zt("🛡️ 清空白名单确认",`确认清空所有已忽略的白名单标题吗？

清空后全库同名检测将重新提示这些文档。`)&&(Fo(new Set),N.capsule({source:"白名单",message:"✓ 白名单已清空",duration:2e3,level:"info",archive:!1}),U());return}let Ee=b.target?.closest(".lv-doc-more-btn");if(Ee){b.stopPropagation(),oe(4);let R=Ee.getAttribute("data-doc-id"),ee=Ee.getAttribute("data-doc-box");if(R&&ee){let ie=Ee.getBoundingClientRect();so({notebookId:ee,docId:R,position:{x:ie.left,y:ie.bottom+4}})}return}let Me=b.target?.closest(".lv-recycle-clip-group-btn");if(Me){b.stopPropagation();let R=Me.getAttribute("data-clip-url"),ee=l.find(ie=>ie.url===R);if(ee&&ee.docIds.length>1){oe(8),Me.textContent="清理中…";let ie=ee.docIds.slice(1);Promise.all(ie.map(ve=>{let qe=ee.docs?.find(Le=>Le.id===ve);return ke.safeRemoveDocToRecycle(ve,qe?.box)})).then(ve=>{let qe=ve.filter(Boolean).length;N.capsule({source:"剪藏去重",message:`✓ 已清理 ${qe} 篇重复网页剪藏`,duration:2500,level:"success",archive:!1}),de()})}return}}),A?.addEventListener("contextmenu",b=>{let K=b.target?.closest(".lv-doc-entry-row");if(K){let ue=K.getAttribute("data-doc-id"),ge=K.getAttribute("data-doc-box");ue&&ge&&(b.preventDefault(),b.stopPropagation(),so({notebookId:ge,docId:ue,position:{x:b.clientX,y:b.clientY}}))}}),A?.addEventListener("change",async b=>{let K=b.target?.closest(".lv-diff-cand-select");if(K){b.stopPropagation();let ue=J(K),z=K.getAttribute("data-drawer-id")||(ue?v(ue.title).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g,"_"):""),G=A?.querySelector(`.lv-diff-drawer-${z}`);ue&&G&&le(G,ue,z,K.value);return}}),de()}function Pn(t,e,n){let o=!!n?.manual,r=Qe(),l=ht(),c=et(),i=c?.getItem(Ut),a=i==="current"&&l?"current":i==="custom"&&r.quickNoteDocumentId?.trim()?"custom":"daily",d=()=>a==="current"&&l?`目标: ${l.title.slice(0,14)} ↻`:a==="custom"?"目标: 指定文档 ↻":"目标: 今日日记 ↻",p=()=>`入库格式：时间戳 + 引用块，追加至${a==="daily"?"今日日记":a==="current"&&l?`《${l.title.slice(0,14)}》`:"指定文档"}`;ft({icon:"📋",title:o?"剪贴入库 · 手动粘贴":"剪贴入库 · 长内容预览",badgeHtml:`${o?"":`${t.length} 字 · `}<button type="button" class="lv-qw-badge lv-qw-badge-btn lv-qw-clip-target-btn" title="点击切换存储目标（今日日记 / 当前文档 / 指定文档）">${v(d())}</button>`,bodyHtml:`<textarea class="lv-qw-textarea b3-text-field" placeholder="${o?tt()?"当前环境无法自动读取剪贴板，请长按屏幕粘贴内容到这里...":"当前环境无法自动读取剪贴板，请长按 / Ctrl+V 粘贴内容到这里...":"确认或编辑剪贴内容后入库..."}" rows="8"></textarea><div class="lv-qw-preview-tag lv-qw-clip-hint" style="margin-top:6px;">${v(p())}</div>`,primaryLabel:"保存入库",showCharCount:!0,onSave:async(h,T)=>{let S=((typeof C<"u"?C.querySelector("#lv-quick-workspace-mask textarea"):null)?.value||"").trim();if(!S){N.capsule({source:"剪贴板",message:"内容为空，已取消入库",duration:1800,archive:!1});return}let P=h?.textContent||"保存入库";h&&(h.textContent="入库中…");try{let j=a==="current"&&l?l.id:a==="custom"&&r.quickNoteDocumentId?r.quickNoteDocumentId.trim():"",D;if(j){let f=await se("/api/block/appendBlock",{data:`${zn(S,e)}
`,dataType:"markdown",parentID:j}),L=kn(f.data);D={ok:f.code===0,msg:f.msg,docId:L.docId||j,blockId:L.blockId}}else D=await st(zn(S,e));if(D.ok){Dn=t,Hn=ae.now(),T();let f=S.replace(/[\r\n\t]+/g," ").slice(0,22),L=D.blockId||D.docId,y=a==="daily"?"日记":a==="current"&&l?`《${l.title.slice(0,14)}》`:"指定文档";N.capsule({source:"剪贴板",message:`📋 已存入${y}: ${f}${S.length>22?"…":""}`,duration:3200,level:"success",archive:!1,action:{label:"定位",onClick:()=>{L?Ze(L):ot()}}});try{yt().record({category:"clip",source:"罗盘",title:`剪贴入库: ${f}`,detail:S.slice(0,120),linkBlockId:L})}catch{}}else h&&(h.textContent="重试保存"),N.capsule({source:"剪贴板",message:`记录失败: ${D.msg||"无法写入今日日记"}`,duration:3e3,level:"error"})}catch{h&&(h.textContent=P),N.capsule({source:"剪贴板",message:"入库异常，请稍后重试",duration:2800,level:"warn"})}}});let g=typeof C<"u"?C.getElementById("lv-quick-workspace-mask"):null;g?.querySelector(".lv-qw-clip-target-btn")?.addEventListener("click",()=>{oe(6),a==="daily"?a=l?"current":r.quickNoteDocumentId?.trim()?"custom":"daily":a==="current"?a=r.quickNoteDocumentId?.trim()?"custom":"daily":a="daily";try{c?.setItem(Ut,a)}catch{}let h=g?.querySelector(".lv-qw-clip-target-btn");h&&(h.textContent=d());let T=g?.querySelector(".lv-qw-clip-hint");T&&(T.textContent=p())}),!o&&t&&q.setTimeout(()=>{try{let h=C.querySelector("#lv-quick-workspace-mask textarea");h&&(h.value=t,h.dispatchEvent(new Re("input")))}catch{}},70)}async function en(){if(!An){An=!0,Se(),$e();try{let t="",e=!1;try{typeof Ue<"u"&&Ue.clipboard&&typeof Ue.clipboard.readText=="function"&&(t=await Ue.clipboard.readText())}catch{e=!0}let n=typeof q<"u"?q.require?.("electron"):null;if(!t&&n?.clipboard?.readText)try{t=n.clipboard.readText()}catch{}t=t?t.trim():"";let o=new ae,r=`${String(o.getHours()).padStart(2,"0")}:${String(o.getMinutes()).padStart(2,"0")}`;if(!t){let i=await Na();if(i){let a=await st(`- **${r}** 🖼️ ${i}`);if(a.ok){let d=a.blockId||a.docId;N.capsule({source:"剪贴板",message:"🖼️ 剪贴板图片已存入 assets 并写入日记",duration:3200,level:"success",archive:!1,action:{label:"看日记",onClick:()=>{d?Ze(d):ot()}}});try{yt().record({category:"clip",source:"罗盘",title:"剪贴图片入库",linkBlockId:d})}catch{}return}N.capsule({source:"剪贴板",message:"图片已存入 assets，但写入日记失败，请手动插入",duration:3e3,level:"warn",archive:!1});return}try{if(n?.clipboard?.readImage&&!n.clipboard.readImage().isEmpty?.()){N.capsule({source:"剪贴板",message:"🖼️ 检测到剪贴板图片，但当前环境不支持自动存图",duration:2400,level:"warn",archive:!1});return}}catch{}if(e){Pn("",r,{manual:!0});return}N.capsule({source:"剪贴板",message:"📋 剪贴板为空或未授权读取",duration:2200,level:"warn",archive:!1});return}let l=ae.now();if(t===Dn&&l-Hn<5e3){N.capsule({source:"剪贴板",message:"📋 刚刚已存入相同剪贴内容，避免重复写入",duration:1800,archive:!1});return}if(t.length>300){Pn(t,r);return}let c=await st(zn(t,r));if(c.ok){Dn=t,Hn=l;let i=t.replace(/[\r\n\t]+/g," ").slice(0,22),a=c.blockId||c.docId;N.capsule({source:"剪贴板",message:`📋 已存入日记: ${i}${t.length>22?"…":""}`,duration:3200,level:"success",archive:!1,action:{label:"看日记",onClick:()=>{a?Ze(a):ot()}}});try{yt().record({category:"clip",source:"罗盘",title:`剪贴入库: ${i}`,detail:t.slice(0,120),linkBlockId:a})}catch{}}else N.capsule({source:"剪贴板",message:`记录失败: ${c.msg||"无法写入今日日记"}`,duration:3e3,level:"error"})}finally{An=!1}}}function ft(t){if(typeof C>"u")return null;Se(),$e();try{C.getElementById("lv-quick-workspace-mask")?.remove()}catch{}fn();let e=C.createElement("div");e.id="lv-quick-workspace-mask",e.className="lv-qw-mask",e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true");let n=t.secondaryLabel?`<button type="button" class="lv-qw-btn lv-qw-btn-secondary" title="Ctrl+Shift+Enter">${v(t.secondaryLabel)}</button>`:"",o=t.showCharCount?'<span class="lv-qw-char-count">0 字</span>':"";e.innerHTML=`<div class="lv-qw-card"><div class="lv-qw-head"><div class="lv-qw-title-wrap"><span class="lv-qw-icon">${t.icon}</span><span class="lv-qw-title">${v(t.title)}</span>${t.badgeHtml}</div><button type="button" class="lv-qw-close" aria-label="关闭">✕</button></div><div class="lv-qw-body">${t.bodyHtml}</div><div class="lv-qw-foot"><div class="lv-qw-tip-wrap"><span class="lv-qw-tip">${t.secondaryLabel?tt()?`点「${v(t.secondaryLabel)}」可连续记录`:"Ctrl+Enter/S 保存 · Ctrl+Shift+Enter 续记 · Esc":tt()?"点「保存」入库 · 点 ✕ 关闭":"Ctrl+Enter/S 保存 · Esc 取消"}</span>${o}</div><div class="lv-qw-actions"><button type="button" class="lv-qw-btn lv-qw-btn-cancel">取消</button>${n}<button type="button" class="lv-qw-btn lv-qw-btn-primary">${v(t.primaryLabel)}</button></div></div></div>`;let r=!1,l,c=()=>{try{t.onBeforeClose?.()}catch{}if(l){try{l()}catch{}l=void 0}try{Ge.pop("lv-quick-workspace-modal")}catch{}try{e.remove()}catch{}try{C.querySelectorAll(".lv-qw-lightbox").forEach(S=>S.remove())}catch{}q.removeEventListener("keydown",p,!0)};try{Ge.push({id:"lv-quick-workspace-modal",dismiss:()=>(c(),!0)})}catch{}let i=e.querySelector(".lv-qw-btn-primary"),a=e.querySelector(".lv-qw-btn-secondary"),d=async S=>{if(!r){r=!0,i&&(i.disabled=!0),a&&(a.disabled=!0);try{await t.onSave(S?a:i,c,S)}finally{r=!1,e.isConnected&&(i&&(i.disabled=!1),a&&(a.disabled=!1))}}};e.querySelector(".lv-qw-close")?.addEventListener("click",c),e.querySelector(".lv-qw-btn-cancel")?.addEventListener("click",c),i?.addEventListener("click",()=>{d(!1)}),a?.addEventListener("click",()=>{d(!0)}),e.addEventListener("click",S=>{S.target===e&&c()});let p=S=>{if(!(S.isComposing||S.keyCode===229)){if(S.key==="Escape"){if(S.defaultPrevented)return;let P=Ge?.top?.();if(P&&P.id!=="lv-quick-workspace-modal")return;let j=C.querySelector(".lv-qw-lightbox");if(j){S.preventDefault(),S.stopPropagation();try{j.remove()}catch{}return}if(e.querySelector(".lv-qw-add-cat-row"))return;S.preventDefault(),S.stopPropagation(),c()}else if((S.ctrlKey||S.metaKey)&&(S.key==="Enter"||S.key==="s"||S.key==="S")){if(S.isComposing||S.keyCode===229)return;S.preventDefault(),S.stopPropagation(),d(!!(S.shiftKey&&t.secondaryLabel))}}};if(q.addEventListener("keydown",p,!0),C.body.appendChild(e),typeof q<"u"&&q.visualViewport){let S=()=>{let P=q.visualViewport;if(!P||!e.isConnected)return;let j=Math.max(0,q.innerHeight-(P.offsetTop+P.height));e.style.paddingBottom=j>80?`${j+12}px`:""};q.visualViewport.addEventListener("resize",S),l=()=>q.visualViewport?.removeEventListener("resize",S)}let g=e.querySelector("textarea"),h=e.querySelector(".lv-qw-char-count"),T=()=>{h&&g&&(h.textContent=`${g.value.length} 字`)},E=()=>{if(g)try{g.style.height="auto";let S=280;g.style.overflowY=g.scrollHeight>S?"auto":"hidden",g.style.height=`${Math.min(g.scrollHeight,S)}px`}catch{}};return g?.addEventListener("input",()=>{T(),E()}),q.setTimeout(()=>{g&&(g.focus(),T(),E())},60),e}async function $t(t){let e=await gt("/api/file/putFile",{method:"POST",body:t}),n=await e.json().catch(()=>null);if(!e.ok||!n||n.code!==0)throw new Error(`putFile failed (HTTP ${e.status}${n&&n.code!==0?`, code ${n.code}`:""})`)}function Xe(t=""){let e=Qe(),n=ht(),o=et(),r=o?.getItem(Ut),l=r==="current"&&n?"current":r==="custom"&&e.quickNoteDocumentId?.trim()||e.quickNoteDocumentId?.trim()&&r!=="daily"?"custom":"daily",c=e.quickNoteNotebookId||e.lifeLogNotebookId||"",i=e.quickNoteDocumentId?.trim()||"",a=e.quickNoteDocumentTitle?.trim()||"",d=()=>l==="current"&&n?`目标: ${n.title.slice(0,12)} ↻`:l==="custom"?`目标: ${(a||"指定文档").slice(0,12)} ↻`:"目标: 今日日记 ↻",p=null,g=0,h=null,T=!1,E=()=>{if(h!==null){try{Oe(h)}catch{}h=null}T=!1},S=()=>{if(h!==null){try{Oe(h)}catch{}h=null}if(!(!T||!p)){T=!1;try{p.value?(o?.setItem(it,p.value),o?.setItem(St,String(ae.now()))):(o?.removeItem(it),o?.removeItem(St))}catch{}}},P=()=>{if(T=!0,h!==null)try{Oe(h)}catch{}let z=typeof q<"u"&&typeof q.setTimeout=="function"?q.setTimeout:Pe;h=Number(z(()=>{h=null,S()},300))},j=()=>yo(It(yn())),D=j(),f=n?'<button type="button" class="lv-qw-tag-chip" data-insert="doclink" title="插入当前文档双链">📎 当前文档</button>':"",L=[],y=e.quickNoteAttachMode==="local-link"?"local-link":"assets",A=ft({icon:"⚡",title:"一键记事",showCharCount:!0,badgeHtml:`<button type="button" class="lv-qw-badge lv-qw-badge-btn" title="点击切换存储目标（今日日记 / 当前文档 / 指定文档）">${v(d())}</button>`,bodyHtml:`
            <div class="lv-qw-nb-row" style="${l==="daily"?"":"display:none;"}">
                <span class="lv-qw-tags-label">📔 日记本</span>
                <select class="lv-qw-nb-select"><option value="">✨ 自动识别默认日记本</option></select>
            </div>
            <div class="lv-qw-custom-doc-row" style="${l==="custom"?"":"display:none;"}">
                <span class="lv-qw-tags-label">📄 指定文档</span>
                <span class="lv-qw-custom-doc-name" title="${a||""}">${v(a||(i?"已选文档":"尚未设定指定文档"))}</span>
                <div class="lv-qw-custom-doc-btns">
                    ${n?`<button type="button" class="lv-qw-tag-chip lv-qw-bind-cur-btn" title="将当前打开的《${v(n.title)}》设为指定文档">📎 设为当前</button>`:""}
                    <button type="button" class="lv-qw-tag-chip lv-qw-pick-doc-btn" title="搜索并绑定思源笔记本中的任意文档">🔍 选取文档</button>
                </div>
            </div>
            <div class="lv-qw-tags-row">
                <span class="lv-qw-tags-label">标记:</span>
                <button type="button" class="lv-qw-tag-chip" data-insert="#灵感 ">#灵感</button>
                <button type="button" class="lv-qw-tag-chip" data-insert="#待办 ">#待办</button>
                <button type="button" class="lv-qw-tag-chip" data-insert="- [ ] ">- [ ] 待办</button>
                <button type="button" class="lv-qw-tag-chip" data-insert="> ">&gt; 引用</button>
                <button type="button" class="lv-qw-tag-chip" data-insert="time">⏱ 时间</button>
                <button type="button" class="lv-qw-tag-chip" data-insert="date">📅 日期</button>
                ${f}
            </div>
            <textarea class="lv-qw-textarea b3-text-field" placeholder="${tt()?"记录想法或待办...":"记录想法或待办... (Ctrl+Enter 保存，Tab 缩进，支持列表续行/拖拽/粘贴)"}" rows="5"></textarea>
            <div class="lv-qw-attach-bar">
                <div class="lv-qw-attach-triggers">
                    <button type="button" class="lv-qw-tag-chip lv-qw-btn-img" title="添加本地图片 (PNG/JPG/GIF/WebP/SVG)">🖼️ 图片</button>
                    <button type="button" class="lv-qw-tag-chip lv-qw-btn-video" title="添加本地视频 (MP4/WebM/MOV/MKV)">📹 视频</button>
                    <button type="button" class="lv-qw-tag-chip lv-qw-btn-file" title="添加任意本地文件">📎 文件</button>
                    <input type="file" class="lv-qw-hidden-file-input" multiple style="display:none;" />
                </div>
                <div class="lv-qw-link-mode-group" title="电脑端插入方式：存入知识库 assets 跨端漫游，或仅插入本地路径 file:// 直链节省存储">
                    <button type="button" class="lv-qw-mode-pill ${y==="assets"?"is-active":""}" data-attach-mode="assets" title="【存入知识库】：将文件复制上传至思源 assets 目录，支持多端同步漫游">💾 存入知识库</button>
                    <button type="button" class="lv-qw-mode-pill ${y==="local-link"?"is-active":""}" data-attach-mode="local-link" title="【对应链接】：仅插入本地文件路径直链 (file:///)，不拷贝大文件，节省磁盘与流量">🔗 对应链接</button>
                </div>
            </div>
            <div class="lv-qw-attach-list" style="display:none;"></div>
            <div class="lv-qw-draft-hint" style="display:none;"><span class="lv-qw-draft-hint-text">🌱 已恢复未保存草稿</span><button type="button" class="lv-qw-draft-clear">清空</button></div>
            ${D}
        `,primaryLabel:"保存入库",secondaryLabel:"保存并继续",onBeforeClose:S,onSave:async(z,G,F)=>{S();let s=p?.value?.trim()||"";if(!s&&L.length===0){N.capsule({source:"一键记事",message:"请输入记事内容或添加附件",duration:1800,archive:!1}),p?.focus();return}if(l==="custom"&&!i){N.capsule({source:"一键记事",message:"请先指定目标文档",duration:2400,level:"warn",archive:!1}),de(B=>{i=B.id,a=B.content,ze({quickNoteDocumentId:i,quickNoteDocumentTitle:a}),U()});return}let I=z?.textContent||"保存入库";z&&(z.textContent=L.length>0?"处理附件中…":"保存中…");try{let B=[];if(L.length>0){let Z=new ae,m=w=>String(w).padStart(2,"0"),u=`${Z.getFullYear()}${m(Z.getMonth()+1)}${m(Z.getDate())}-${m(Z.getHours())}${m(Z.getMinutes())}${m(Z.getSeconds())}`;for(let w=0;w<L.length;w++){let x=L[w];if(x)if(x.mode==="assets"){let M=x.name.includes(".")?x.name.split(".").pop():x.type==="image"?"png":x.type==="video"?"mp4":"bin",_=`lv-qn-${u}-${w}-${Math.random().toString(36).slice(2,6)}.${M}`;try{let W=new FormData;W.append("path",`/data/assets/${_}`),W.append("file",x.file,_),W.append("isDir","false"),await $t(W),x.type==="image"?B.push(`![${x.name}](assets/${_})`):x.type==="video"?B.push(`<video controls src="assets/${_}" style="max-width:100%; border-radius:8px;"></video>`):B.push(`[📎 ${x.name}](assets/${_})`)}catch(W){console.warn("[LvQuickNote] 附件写入 assets 失败:",W)}}else{let M=x.localPath||x.file.path||"";if(M){let _=M.replace(/\\/g,"/"),W=_.startsWith("/")?`file://${_}`:`file:///${_}`;x.type==="image"?B.push(`![${x.name}](${W})`):x.type==="video"?B.push(`<video controls src="${W}" style="max-width:100%; border-radius:8px;"></video>
[📹 本地视频: ${x.name}](${W})`):B.push(`[📎 本地文件: ${x.name}](${W})`)}else{let _=x.name.includes(".")?x.name.split(".").pop():"bin",W=`lv-qn-${u}-${w}-${Math.random().toString(36).slice(2,6)}.${_}`;try{let ce=new FormData;ce.append("path",`/data/assets/${W}`),ce.append("file",x.file,W),ce.append("isDir","false"),await $t(ce),B.push(x.type==="image"?`![${x.name}](assets/${W})`:`[📎 ${x.name}](assets/${W})`)}catch{}}}}}let k=[s,...B].filter(Boolean).join(`

`),$=l==="current"&&n?n.id:l==="custom"&&i?i:"",O;if($){let Z=await se("/api/block/appendBlock",{data:`${k}
`,dataType:"markdown",parentID:$}),m=kn(Z.data);O={ok:Z.code===0,msg:Z.msg,docId:m.docId||$,blockId:m.blockId}}else O=await st(`${k}
`,c||e.quickNoteNotebookId);if(O.ok){E();try{o?.removeItem(it),o?.removeItem(St)}catch{}let Z=(s.split(/\r?\n/)[0]||(L[0]?.name?`[附件] ${L[0].name}`:"记事")).replace(/[\r\n\t]+/g," ").trim().slice(0,30);go(yn(),Z,O.blockId);let m=O.blockId||O.docId;try{yt().record({category:"note",source:"一键记事",title:Z,linkBlockId:m})}catch{}if(L.forEach(u=>{if(u.previewUrl)try{URL.revokeObjectURL(u.previewUrl)}catch{}}),L.length=0,K(),F){g+=1,p&&(p.value="",p.dispatchEvent(new Re("input")),p.focus()),E();let u=A?.querySelector(".lv-qw-draft-hint");u&&(u.style.display="none");let w=A?.querySelector(".lv-qw-recent-strip");w&&(w.outerHTML=j()),z&&(z.textContent=g>1?`✓ 已存 ${g} 条，继续`:"✓ 已存，继续记"),q.setTimeout(()=>{z&&z.isConnected&&(z.textContent=I)},1200),N.capsule({source:"一键记事",message:"⚡ 已入库，可继续记录下一条",duration:1800,archive:!1})}else{G();let u=l==="current"&&n?n.title:l==="custom"?a||"指定文档":"今日日记";N.capsule({source:"一键记事",message:l==="daily"?"⚡ 已成功记入今日日记":`⚡ 已成功存入《${u}》`,duration:2600,level:"success",archive:!1,action:m?{label:"定位",onClick:()=>{Ze(m)}}:void 0})}}else z&&(z.textContent="重试保存"),N.capsule({source:"一键记事",message:`保存失败: ${O.msg||"请检查内核状态"}`,duration:2800})}catch{z&&(z.textContent="重试保存"),N.capsule({source:"一键记事",message:"保存异常",duration:2800})}}});if(!A)return;p=A.querySelector(".lv-qw-textarea");let Q=A.querySelector(".lv-qw-badge-btn"),re=A.querySelector(".lv-qw-nb-row"),fe=A.querySelector(".lv-qw-nb-select"),ne=A.querySelector(".lv-qw-custom-doc-row"),Y=A.querySelector(".lv-qw-custom-doc-name"),pe=A.querySelector(".lv-qw-draft-hint"),U=()=>{Y&&(Y.textContent=a||(i?"已选文档":"尚未设定指定文档"),Y.title=a||""),Q&&(Q.textContent=d())};i&&!a&&se("/api/query/sql",{stmt:`SELECT content FROM blocks WHERE id = '${i.replace(/'/g,"''")}' AND type='d' LIMIT 1`}).then(z=>{z.code===0&&Array.isArray(z.data)&&z.data[0]?.content&&(a=String(z.data[0].content).trim(),U())}),A.querySelector(".lv-qw-bind-cur-btn")?.addEventListener("click",()=>{n&&(i=n.id,a=n.title,ze({quickNoteDocumentId:i,quickNoteDocumentTitle:a}),U(),oe(8),N.capsule({source:"一键记事",message:`已设定指定文档为《${n.title}》`,duration:2200,archive:!1}))});let de=z=>{let G=A.querySelector(".lv-qw-card");if(!G)return;let F=G.querySelector(".lv-qw-doc-picker-modal");if(F){F.remove();return}let s=C.createElement("div");s.className="lv-qw-doc-picker-modal",s.innerHTML=`
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <strong style="font-size:12px;color:var(--lv-lp-text);">🔍 选取指定目标文档</strong>
                <button type="button" class="lv-qw-doc-picker-close" aria-label="关闭选取" title="关闭 (Esc)" style="border:none;background:transparent;cursor:pointer;color:var(--lv-lp-text-sub);font-size:14px;padding:4px 8px;min-width:32px;min-height:32px;border-radius:5px;">✕</button>
            </div>
            <input type="text" class="lv-qw-doc-search-input" placeholder="输入关键词搜索文档..." autofocus />
            <div class="lv-qw-doc-results"></div>
        `;let I=s.querySelector(".lv-qw-doc-search-input"),B=s.querySelector(".lv-qw-doc-results"),k=()=>{s.remove()};s.querySelector(".lv-qw-doc-picker-close")?.addEventListener("click",k);let $=async Z=>{if(!B)return;let m=Z.replace(/['\\%_]/g,"").trim(),w=`SELECT id, content, hpath FROM blocks WHERE type='d' ${m?`AND content LIKE '%${m}%'`:""} AND content NOT LIKE '%(冲突%' AND content NOT LIKE '%conflict%' ORDER BY updated DESC LIMIT 8`;try{let x=await se("/api/query/sql",{stmt:w});if(!s.isConnected)return;x.code===0&&Array.isArray(x.data)&&x.data.length>0?(B.innerHTML=x.data.map(M=>`
                        <button type="button" class="lv-qw-doc-item" data-id="${v(M.id)}" data-title="${v(M.content||"未命名")}">
                            <span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📄 ${v(M.content||"未命名")}</span>
                            <small style="color:var(--lv-lp-text-sub);margin-left:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">${v(M.hpath||"")}</small>
                        </button>
                    `).join(""),B.querySelectorAll(".lv-qw-doc-item").forEach(M=>{M.addEventListener("click",()=>{let _=M.getAttribute("data-id")||"",W=M.getAttribute("data-title")||"";z({id:_,content:W}),k()})})):B.innerHTML='<div style="text-align:center;padding:12px;font-size:11.5px;color:var(--lv-lp-text-sub);">未找到相关文档</div>'}catch{B&&(B.innerHTML='<div style="text-align:center;padding:12px;font-size:11.5px;color:var(--lv-lp-text-sub);">搜索失败</div>')}},O=null;I?.addEventListener("input",()=>{O&&Oe(O),O=q.setTimeout(()=>{$(I.value)},120)}),G.appendChild(s),$(""),q.setTimeout(()=>I?.focus(),40)};A.querySelector(".lv-qw-pick-doc-btn")?.addEventListener("click",()=>{oe(6),de(z=>{i=z.id,a=z.content,ze({quickNoteDocumentId:i,quickNoteDocumentTitle:a}),U(),N.capsule({source:"一键记事",message:`已设定指定文档为《${z.content}》`,duration:2200,archive:!1})})});let J=A.querySelector(".lv-qw-hidden-file-input"),le=A.querySelector(".lv-qw-attach-list"),b=A.querySelectorAll(".lv-qw-mode-pill");b.forEach(z=>{z.addEventListener("click",()=>{let G=z.getAttribute("data-attach-mode");G&&G!==y&&(y=G,b.forEach(F=>F.classList.toggle("is-active",F.getAttribute("data-attach-mode")===G)),ze({quickNoteAttachMode:G}),L.forEach(F=>{F.mode=G}),K(),oe(6),N.capsule({source:"一键记事",message:G==="assets"?"已切换：存入知识库 (assets 跨端漫游)":"已切换：插入对应链接 (file:// 本地直链)",duration:1800,archive:!1}))})});let K=()=>{if(le){if(L.length===0){le.style.display="none",le.innerHTML="";return}le.style.display="flex",le.innerHTML=L.map(z=>`
            <div class="lv-qw-attach-chip" data-att-id="${z.id}">
                ${z.previewUrl?`<img class="lv-qw-attach-thumb" src="${z.previewUrl}" alt="${v(z.name)}" />`:`<span style="font-size:14px;">${z.type==="video"?"📹":"📎"}</span>`}
                <span class="lv-qw-attach-name" title="${v(z.name)}">${v(z.name)}</span>
                <small class="lv-qw-attach-size">${z.sizeStr}</small>
                <button type="button" class="lv-qw-item-mode-btn" data-toggle="${z.id}" title="点击切换此文件的插入模式">${z.mode==="assets"?"💾 知识库":"🔗 本地链"}</button>
                <button type="button" class="lv-qw-attach-remove" data-del="${z.id}" title="移除附件">✕</button>
            </div>
        `).join(""),le.querySelectorAll("[data-toggle]").forEach(z=>{z.addEventListener("click",G=>{G.stopPropagation();let F=z.getAttribute("data-toggle"),s=L.find(I=>I.id===F);s&&(s.mode=s.mode==="assets"?"local-link":"assets",K())})}),le.querySelectorAll("[data-del]").forEach(z=>{z.addEventListener("click",G=>{G.stopPropagation();let F=z.getAttribute("data-del"),s=L.findIndex(I=>I.id===F);if(s>=0){let I=L[s];if(I&&I.previewUrl)try{URL.revokeObjectURL(I.previewUrl)}catch{}L.splice(s,1),K()}})})}},ue=z=>{for(let G of z){let F=G.type.startsWith("image/")?"image":G.type.startsWith("video/")?"video":"file",s=String(G.path||""),I=G.size>1024*1024?`${(G.size/(1024*1024)).toFixed(1)}MB`:`${Math.round(G.size/1024)}KB`,B=F==="image"?URL.createObjectURL(G):void 0;L.push({id:`att-${ae.now()}-${Math.random().toString(36).slice(2,6)}`,file:G,name:G.name,sizeStr:I,type:F,mode:y,localPath:s,previewUrl:B})}K(),oe(8)};A.querySelector(".lv-qw-btn-img")?.addEventListener("click",()=>{J&&(J.accept="image/*",J.click())}),A.querySelector(".lv-qw-btn-video")?.addEventListener("click",()=>{J&&(J.accept="video/*",J.click())}),A.querySelector(".lv-qw-btn-file")?.addEventListener("click",()=>{J&&(J.accept="*/*",J.click())}),J?.addEventListener("change",()=>{J.files?.length&&(ue(Array.from(J.files)),J.value="")}),p?.addEventListener("dragover",z=>{z.preventDefault(),p.classList.add("is-dragover")}),p?.addEventListener("dragleave",()=>{p.classList.remove("is-dragover")}),p?.addEventListener("drop",z=>{z.preventDefault(),p.classList.remove("is-dragover"),z.dataTransfer?.files?.length&&(ue(Array.from(z.dataTransfer.files)),N.capsule({source:"一键记事",message:`📎 已拖入 ${z.dataTransfer.files.length} 个文件`,duration:1800,archive:!1}))}),p?.addEventListener("paste",z=>{z.clipboardData?.files?.length&&(ue(Array.from(z.clipboardData.files)),N.capsule({source:"一键记事",message:"📎 已添加剪贴板文件",duration:1800,archive:!1}))});let ge=o?.getItem(it);if(ge&&p){if(p.value=ge,pe){let z=Number(o?.getItem(St)||0),G=pe.querySelector(".lv-qw-draft-hint-text")||pe.querySelector("span");if(G&&z>0){let F=new ae(z);G.textContent=`🌱 已恢复未保存草稿 · 存于 ${String(F.getHours()).padStart(2,"0")}:${String(F.getMinutes()).padStart(2,"0")}`}pe.style.display="flex"}}else t&&p&&(p.value=t);fe&&(lt().then(z=>{!fe.isConnected||!z.length||(fe.innerHTML='<option value="">✨ 自动识别默认日记本</option>'+z.map(G=>`<option value="${v(G.id)}" ${G.id===c?"selected":""}>📔 ${v(G.name)}</option>`).join(""))}).catch(()=>{}),fe.addEventListener("change",()=>{c=fe.value.trim(),ze({quickNoteNotebookId:c||void 0})})),A.querySelector(".lv-qw-draft-clear")?.addEventListener("click",()=>{E();try{o?.removeItem(it),o?.removeItem(St)}catch{}p&&(p.value="",p.dispatchEvent(new Re("input"))),E(),pe&&(pe.style.display="none"),p?.focus()}),A.addEventListener("click",z=>{z.target?.closest(".lv-qw-undo-btn")&&(z.stopPropagation(),xo(yn(),"一键记事",()=>{let F=A?.querySelector(".lv-qw-recent-strip");F&&(F.outerHTML=j())}))}),Q?.addEventListener("click",()=>{oe(6),l==="daily"?l=n?"current":"custom":l==="current"?l="custom":l="daily";try{o?.setItem(Ut,l)}catch{}Q.textContent=d(),re&&(re.style.display=l==="daily"?"flex":"none"),ne&&(ne.style.display=l==="custom"?"flex":"none")}),A.querySelector(".lv-qw-tags-row")?.addEventListener("click",z=>{let G=z.target?.closest(".lv-qw-tag-chip");if(!G||!p)return;let F=G.getAttribute("data-insert")||"";oe(6);let s=F;if(F==="time")s=`${String(new ae().getHours()).padStart(2,"0")}:${String(new ae().getMinutes()).padStart(2,"0")} `;else if(F==="date"){let k=new ae;s=`${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")} `}else F==="doclink"&&n&&(s=`[《${n.title}》](siyuan://blocks/${n.id}) `);let I=p.selectionStart??p.value.length,B=p.selectionEnd??p.value.length;p.value=p.value.slice(0,I)+s+p.value.slice(B),p.selectionStart=p.selectionEnd=I+s.length,p.dispatchEvent(new Re("input")),p.focus();try{o?.setItem(it,p.value)}catch{}}),p?.addEventListener("keydown",z=>{if(!(z.isComposing||z.keyCode===229)){if(z.key==="Tab"&&!z.shiftKey){z.preventDefault();let G=p.selectionStart??p.value.length,F=p.selectionEnd??p.value.length;p.value=p.value.slice(0,G)+"  "+p.value.slice(F),p.selectionStart=p.selectionEnd=G+2,p.dispatchEvent(new Re("input"));return}if(z.key==="Enter"&&!z.ctrlKey&&!z.metaKey&&!z.shiftKey){let G=p.selectionStart,F=p.value,s=F.lastIndexOf(`
`,G-1)+1,I=F.slice(s,G),B=I.match(/^(\s*)(- \[[ x]\] |- |\* |\d+\. )/);if(B){if(z.preventDefault(),I.trim()===B[0].trim()){p.value=F.slice(0,s)+F.slice(G),p.selectionStart=p.selectionEnd=s,p.dispatchEvent(new Re("input"));return}let k=`
`+(B[0].includes("[ ]")||B[0].includes("[x]")?`${B[1]}- [ ] `:B[0]);p.value=F.slice(0,G)+k+F.slice(p.selectionEnd),p.selectionStart=p.selectionEnd=G+k.length,p.dispatchEvent(new Re("input"))}}}}),p?.addEventListener("input",P)}function Nt(){let t=Qe(),e=ht(),n=et(),o=t.lifeLogCategories?.length?[...t.lifeLogCategories]:[...un],r=new Set(un),l=o[0]||"日记",c=t.lifeLogNotebookId||"",i=0,a=!1,d=n?.getItem("lv-lifelog-target-mode"),p=d==="current"&&e?"current":d==="custom"&&t.lifeLogDocumentId?.trim()?"custom":"daily",g=t.lifeLogDocumentId?.trim()||"",h=t.lifeLogDocumentTitle?.trim()||"",T=()=>p==="current"&&e?`目标: ${e.title.slice(0,12)} ↻`:p==="custom"?`目标: ${(h||"指定文档").slice(0,12)} ↻`:"目标: 今日日记 ↻",E=[],S=t.quickNoteAttachMode==="local-link"?"local-link":"assets",P=()=>{let m=new ae(ae.now()-i*6e4);return`${String(m.getHours()).padStart(2,"0")}:${String(m.getMinutes()).padStart(2,"0")}`},j=()=>o.map(w=>{let x=!r.has(w)&&o.length>1?`<button type="button" class="lv-qw-cat-del" data-del-cat="${v(w)}" title="删除自定义分类">×</button>`:"";return`<span class="lv-qw-cat-pill"><button type="button" class="lv-qw-cat-chip ${w===l?"active":""}" data-cat="${v(w)}">${ra(w)} ${v(w)}</button>${x}</span>`}).join("")+(a?'<div class="lv-qw-add-cat-row" style="width:100%;"><input type="text" class="lv-qw-add-cat-input" placeholder="输入新分类名（如：运动、阅读）…" maxlength="12" /><button type="button" class="lv-qw-btn lv-qw-btn-primary lv-qw-add-cat-confirm" style="padding:4px 10px;font-size:11px;">添加</button><button type="button" class="lv-qw-btn lv-qw-add-cat-cancel" style="padding:4px 9px;font-size:11px;">取消</button></div>':'<button type="button" class="lv-qw-add-cat-btn" title="添加自定义分类">+ 自定义</button>'),D=()=>yo(ha(),{catCounts:!0}),f=D(),L=e?'<button type="button" class="lv-qw-tag-chip" data-insert="doclink" title="插入当前文档双链">📎 当前文档</button>':"",y=null,A=null,Q=!1,re=()=>{if(A!==null){try{Oe(A)}catch{}A=null}Q=!1},fe=()=>{if(A!==null){try{Oe(A)}catch{}A=null}if(!(!Q||!y)){Q=!1;try{y.value?(n?.setItem(rt,y.value),n?.setItem(Tt,String(ae.now()))):(n?.removeItem(rt),n?.removeItem(Tt))}catch{}}},ne=()=>{if(Q=!0,A!==null)try{Oe(A)}catch{}let m=typeof q<"u"&&typeof q.setTimeout=="function"?q.setTimeout:Pe;A=Number(m(()=>{A=null,fe()},300))},Y=ft({icon:"📒",title:"LifeLog 流",showCharCount:!0,badgeHtml:`<button type="button" class="lv-qw-badge lv-qw-badge-btn lv-qw-ll-badge-target" title="点击切换存储目标（今日日记 / 当前文档 / 指定文档）">${v(T())}</button>`,bodyHtml:`
            <div class="lv-qw-nb-row" style="${p==="daily"?"":"display:none;"}">
                <span class="lv-qw-tags-label">📔 日记本</span>
                <select class="lv-qw-nb-select lv-qw-ll-nb-select"><option value="">✨ 自动识别默认日记本</option></select>
            </div>
            <div class="lv-qw-custom-doc-row" style="${p==="custom"?"":"display:none;"}">
                <span class="lv-qw-tags-label">📄 指定文档</span>
                <span class="lv-qw-custom-doc-name" title="${h||""}">${v(h||(g?"已选文档":"尚未设定指定文档"))}</span>
                <div class="lv-qw-custom-doc-btns">
                    ${e?`<button type="button" class="lv-qw-tag-chip lv-qw-bind-cur-btn" title="将当前打开的《${v(e.title)}》设为指定文档">📎 设为当前</button>`:""}
                    <button type="button" class="lv-qw-tag-chip lv-qw-pick-doc-btn" title="搜索并绑定思源笔记本中的任意文档">🔍 选取文档</button>
                </div>
            </div>
            <div class="lv-qw-categories">${j()}</div>
            <div class="lv-qw-tags-row">
                <span class="lv-qw-tags-label">标记:</span>
                <button type="button" class="lv-qw-tag-chip" data-insert="#进展 ">#进展</button>
                <button type="button" class="lv-qw-tag-chip" data-insert="#待办 ">#待办</button>
                <button type="button" class="lv-qw-tag-chip" data-insert="- [ ] ">- [ ] 待办</button>
                <button type="button" class="lv-qw-tag-chip" data-insert="> ">&gt; 引用</button>
                <button type="button" class="lv-qw-tag-chip" data-insert="time">⏱ 时间</button>
                <button type="button" class="lv-qw-tag-chip" data-insert="date">📅 日期</button>
                ${L}
            </div>
            <textarea class="lv-qw-textarea b3-text-field" placeholder="${tt()?"记录进展、状态或思考（点下方 📷 可添加照片）...":"记录进展、状态或思考... (Ctrl+Enter 记录，Tab 缩进，支持列表续行/拖拽/粘贴)"}" rows="5"></textarea>
            <div class="lv-qw-attach-bar">
                <div class="lv-qw-attach-triggers">
                    <button type="button" class="lv-qw-tag-chip lv-qw-btn-img lv-qw-photo-btn" title="添加本地图片 (PNG/JPG/GIF/WebP/SVG)">🖼️ 图片</button>
                    <button type="button" class="lv-qw-tag-chip lv-qw-btn-video" title="添加本地视频 (MP4/WebM/MOV/MKV)">📹 视频</button>
                    <button type="button" class="lv-qw-tag-chip lv-qw-btn-file" title="添加任意本地文件">📎 文件</button>
                    <input type="file" class="lv-qw-hidden-file-input" multiple style="display:none;" />
                </div>
                <div class="lv-qw-link-mode-group" title="电脑端插入方式：存入知识库 assets 跨端漫游，或仅插入本地路径 file:// 直链节省存储">
                    <button type="button" class="lv-qw-mode-pill ${S==="assets"?"is-active":""}" data-attach-mode="assets" title="【存入知识库】：将文件复制上传至思源 assets 目录，支持多端同步漫游">💾 存入知识库</button>
                    <button type="button" class="lv-qw-mode-pill ${S==="local-link"?"is-active":""}" data-attach-mode="local-link" title="【对应链接】：仅插入本地文件路径直链 (file:///)，不拷贝大文件，节省磁盘与流量">🔗 对应链接</button>
                </div>
            </div>
            <div class="lv-qw-attach-strip lv-qw-attach-list" style="display:none;"></div>
            <div class="lv-qw-draft-hint" style="display:none;"><span class="lv-qw-draft-hint-text">🌱 已恢复未保存草稿</span><button type="button" class="lv-qw-draft-clear">清空</button></div>
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
                <div class="lv-qw-preview-tag" style="flex:1;min-width:170px;">预览：<span class="lv-qw-preview-text">${P()} ${v(l)}：...</span></div>
                <div class="lv-qw-time-offsets">
                    <button type="button" class="lv-qw-time-chip active" data-offset="0">现在</button>
                    <button type="button" class="lv-qw-time-chip" data-offset="5">-5分</button>
                    <button type="button" class="lv-qw-time-chip" data-offset="15">-15分</button>
                    <button type="button" class="lv-qw-time-chip" data-offset="30">-30分</button>
                    <button type="button" class="lv-qw-time-chip" data-offset="60">-1时</button>
                </div>
            </div>
            ${f}
        `,primaryLabel:"记录到日记",secondaryLabel:"记完继续",onBeforeClose:fe,onSave:async(m,u,w)=>{fe();let x=y?.value?.trim()||"";if(!x&&E.length===0){N.capsule({source:"LifeLog",message:"请输入日志内容或添加附件",duration:1800,archive:!1}),y?.focus();return}if(p==="custom"&&!g){N.capsule({source:"LifeLog",message:"请先指定目标文档",duration:2400,level:"warn",archive:!1}),G(_=>{g=_.id,h=_.content,ze({lifeLogDocumentId:g,lifeLogDocumentTitle:h}),z()});return}let M=m?.textContent||"记录到日记";m&&(m.textContent=E.length>0?"处理附件中…":"记录中…");try{let _=[];if(E.length>0){let me=ae.now();for(let Te=0;Te<E.length;Te++){let be=E[Te];if(be)if(be.mode==="assets"){let De=be.name.includes(".")?be.name.split(".").pop():"bin",Ee=`lv-lifelog-${me}-${Te}-${Math.random().toString(36).slice(2,6)}.${De}`;try{if(be.type==="image"){let Me=await Ho(be.file,`${me}`,Te+1);if(Me?.path)_.push(`![${be.name}](${Me.path})`);else{let R=new FormData;R.append("path",`/data/assets/${Ee}`),R.append("file",be.file,Ee),R.append("isDir","false"),await $t(R),_.push(`![${be.name}](assets/${Ee})`)}}else{let Me=new FormData;Me.append("path",`/data/assets/${Ee}`),Me.append("file",be.file,Ee),Me.append("isDir","false"),await $t(Me),be.type==="video"?_.push(`<video controls src="assets/${Ee}" style="max-width:100%; border-radius:8px;"></video>`):_.push(`[📎 ${be.name}](assets/${Ee})`)}}catch(Me){console.warn("[LvLifeLog] 附件写入 assets 失败:",Me)}}else{let De=be.localPath||be.file.path||"";if(De){let Ee=De.replace(/\\/g,"/"),Me=Ee.startsWith("/")?`file://${Ee}`:`file:///${Ee}`;be.type==="image"?_.push(`![${be.name}](${Me})`):be.type==="video"?_.push(`<video controls src="${Me}" style="max-width:100%; border-radius:8px;"></video>
[📹 本地视频: ${be.name}](${Me})`):_.push(`[📎 本地文件: ${be.name}](${Me})`)}else{let Ee=be.name.includes(".")?be.name.split(".").pop():"bin",Me=`lv-lifelog-${me}-${Te}-${Math.random().toString(36).slice(2,6)}.${Ee}`;try{let R=new FormData;R.append("path",`/data/assets/${Me}`),R.append("file",be.file,Me),R.append("isDir","false"),await $t(R),_.push(be.type==="image"?`![${be.name}](assets/${Me})`:`[📎 ${be.name}](assets/${Me})`)}catch{}}}}}let W=P(),ce={time:W,type:l,body:x||"附件记录",source:"lv-launchpad",module:"lifelog",notebook:c||t.lifeLogNotebookId},te=ao(ce),ye=`${W} ${l}：${x}`,V=Object.entries(te).map(([me,Te])=>`${me}="${ca(Te)}"`).join(" "),xe=_.length?_.join(`

`):"",Ie=xe?`${ye}
{: ${V} }

${xe}
`:`${ye}
{: ${V} }
`,He=p==="current"&&e?e.id:p==="custom"&&g?g:"",Ae;if(He){let me=await se("/api/block/appendBlock",{data:Ie,dataType:"markdown",parentID:He}),Te=Gt(me.data);Te.blockId&&await se("/api/attr/setBlockAttrs",{id:Te.blockId,attrs:te}),Ae={ok:me.code===0,msg:me.msg,docId:Te.docId||He,blockId:Te.blockId,ids:Te.ids}}else Ae=await st(Ie,c||t.lifeLogNotebookId,{attrs:te});if(Ae.ok){re();try{n?.removeItem(rt),n?.removeItem(Tt)}catch{}let me=Ae.blockId||Ae.docId,Te=(Ae.ids||[]).filter(R=>R!==Ae.blockId),be=E.filter(R=>R.type==="image").length,De=E.filter(R=>R.type!=="image").length,Ee=[];be&&Ee.push(`📷×${be}`),De&&Ee.push(`📎×${De}`);let Me=Ee.length?`${ye} ${Ee.join(" ")}`:ye;ma(Me,Ae.blockId,Te),E.length=0,B();try{yt().record({category:"note",source:"LifeLog",title:`${l}：${x.replace(/[\r\n]+/g," ").slice(0,24)}`,linkBlockId:me})}catch{}if(w){y&&(y.value="",y.dispatchEvent(new Re("input")),y.focus()),re();let R=Y?.querySelector(".lv-qw-draft-hint");R&&(R.style.display="none");let ee=Y?.querySelector(".lv-qw-recent-strip");ee&&(ee.outerHTML=D());let ie=Ee.length?` · ${Ee.join(" ")}`:"";m&&(m.textContent="✓ 已记，继续"),q.setTimeout(()=>{m&&m.isConnected&&(m.textContent=M)},1200),N.capsule({source:"LifeLog",message:`📒 已记录（${l}${ie}），继续下一条`,duration:1800,archive:!1})}else u(),N.capsule({source:"LifeLog",message:`📒 已记录至${p==="current"?"当前文档":p==="custom"?"指定文档":"今日日记"}（${l}${E.length?` · 📎×${E.length}`:""}）`,duration:2600,level:"success",archive:!1,action:{label:"查看",onClick:()=>{me?Ze(me):ot()}}})}else m&&(m.textContent="重试记录"),N.capsule({source:"LifeLog",message:`记录失败: ${Ae.msg||"异常"}`,duration:3e3})}catch{m&&(m.textContent="重试记录"),N.capsule({source:"LifeLog",message:"记录异常",duration:3e3})}}});if(!Y)return;y=Y.querySelector("textarea");let pe=Y.querySelector(".lv-qw-preview-text"),U=Y.querySelector(".lv-qw-categories"),de=Y.querySelector(".lv-qw-time-offsets"),J=Y.querySelector(".lv-qw-draft-hint"),le=Y.querySelector(".lv-qw-ll-nb-select"),b=Y.querySelector(".lv-qw-ll-badge-target"),K=Y.querySelector(".lv-qw-nb-row"),ue=Y.querySelector(".lv-qw-custom-doc-row"),ge=Y.querySelector(".lv-qw-custom-doc-name"),z=()=>{ge&&(ge.textContent=h||(g?"已选文档":"尚未设定指定文档"),ge.title=h||""),b&&(b.textContent=T())};b&&b.addEventListener("click",()=>{p==="daily"?p=e?"current":"custom":p==="current"?p="custom":p="daily";try{n?.setItem("lv-lifelog-target-mode",p)}catch{}K&&(K.style.display=p==="daily"?"flex":"none"),ue&&(ue.style.display=p==="custom"?"flex":"none"),b.textContent=T(),oe(6)}),le&&(lt().then(m=>{!le.isConnected||!m.length||(le.innerHTML='<option value="">✨ 自动识别默认日记本</option>'+m.map(u=>`<option value="${v(u.id)}" ${u.id===c?"selected":""}>📔 ${v(u.name)}</option>`).join(""))}).catch(()=>{}),le.addEventListener("change",()=>{c=le.value.trim(),ze({lifeLogNotebookId:c||void 0})})),Y.querySelector(".lv-qw-bind-cur-btn")?.addEventListener("click",()=>{e&&(g=e.id,h=e.title,ze({lifeLogDocumentId:g,lifeLogDocumentTitle:h}),z(),oe(8),N.capsule({source:"LifeLog",message:`已设定指定文档为《${e.title}》`,duration:2200,archive:!1}))});let G=m=>{let u=Y.querySelector(".lv-qw-card");if(!u)return;let w=u.querySelector(".lv-qw-doc-picker-modal");if(w){w.remove();return}let x=C.createElement("div");x.className="lv-qw-doc-picker-modal",x.innerHTML=`
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <strong style="font-size:12px;color:var(--lv-lp-text);">🔍 选取 LifeLog 指定目标文档</strong>
                <button type="button" class="lv-qw-doc-picker-close" aria-label="关闭选取" title="关闭 (Esc)" style="border:none;background:transparent;cursor:pointer;color:var(--lv-lp-text-sub);font-size:14px;padding:4px 8px;min-width:32px;min-height:32px;border-radius:5px;">✕</button>
            </div>
            <input type="text" class="lv-qw-doc-search-input" placeholder="输入关键词搜索文档..." autofocus />
            <div class="lv-qw-doc-results"></div>
        `;let M=x.querySelector(".lv-qw-doc-search-input"),_=x.querySelector(".lv-qw-doc-results"),W=()=>x.remove();x.querySelector(".lv-qw-doc-picker-close")?.addEventListener("click",W);let ce=async ye=>{if(_){_.innerHTML='<div style="text-align:center;padding:12px;font-size:11.5px;color:var(--lv-lp-text-sub);">搜索中…</div>';try{let V=ye.trim(),xe=V.replace(/'/g,"''").replace(/([%_\\])/g,"\\$1"),Ie=V?`SELECT id, content FROM blocks WHERE type='d' AND content LIKE '%${xe}%' ESCAPE '\\' ORDER BY updated DESC LIMIT 15`:"SELECT id, content FROM blocks WHERE type='d' ORDER BY updated DESC LIMIT 15",He=await se("/api/query/sql",{stmt:Ie}),Ae=Array.isArray(He.data)?He.data:[];Ae.length>0?(_.innerHTML=Ae.map(me=>`
                        <button type="button" class="lv-qw-doc-item" data-doc-id="${me.id}" data-doc-title="${v(me.content||"未命名文档")}">
                            <span>📄 ${v(me.content||"未命名文档")}</span>
                            <small style="color:var(--lv-lp-text-sub);font-size:10px;">${me.id.slice(0,15)}</small>
                        </button>
                    `).join(""),_.querySelectorAll(".lv-qw-doc-item").forEach(me=>{me.addEventListener("click",()=>{let Te=me.getAttribute("data-doc-id")||"",be=me.getAttribute("data-doc-title")||"";m({id:Te,content:be}),W()})})):_.innerHTML='<div style="text-align:center;padding:12px;font-size:11.5px;color:var(--lv-lp-text-sub);">未找到相关文档</div>'}catch{_&&(_.innerHTML='<div style="text-align:center;padding:12px;font-size:11.5px;color:var(--lv-lp-text-sub);">搜索失败</div>')}}},te=null;M?.addEventListener("input",()=>{te&&Oe(te),te=q.setTimeout(()=>{ce(M.value)},120)}),u.appendChild(x),ce(""),q.setTimeout(()=>M?.focus(),40)};Y.querySelector(".lv-qw-pick-doc-btn")?.addEventListener("click",()=>{oe(6),G(m=>{g=m.id,h=m.content,ze({lifeLogDocumentId:g,lifeLogDocumentTitle:h}),z(),N.capsule({source:"LifeLog",message:`已设定指定文档为《${m.content}》`,duration:2200,archive:!1})})});let F=Y.querySelector(".lv-qw-hidden-file-input"),s=Y.querySelector(".lv-qw-attach-list"),I=Y.querySelectorAll(".lv-qw-mode-pill");I.forEach(m=>{m.addEventListener("click",()=>{let u=m.getAttribute("data-attach-mode");u&&u!==S&&(S=u,I.forEach(w=>w.classList.toggle("is-active",w.getAttribute("data-attach-mode")===u)),ze({quickNoteAttachMode:u}),E.forEach(w=>{w.mode=u}),B(),oe(6),N.capsule({source:"LifeLog",message:u==="assets"?"已切换：存入知识库 (assets 跨端漫游)":"已切换：插入对应链接 (file:// 本地直链)",duration:1800,archive:!1}))})});let B=()=>{if(s){if(E.length===0){s.style.display="none",s.innerHTML="",O();return}s.style.display="flex",s.innerHTML=E.map(m=>`
            <div class="lv-qw-attach-chip" data-att-id="${m.id}">
                ${m.previewUrl?`<img class="lv-qw-attach-thumb" src="${m.previewUrl}" alt="${v(m.name)}" />`:`<span style="font-size:14px;">${m.type==="video"?"📹":"📎"}</span>`}
                <span class="lv-qw-attach-name" title="${v(m.name)}">${v(m.name)}</span>
                <small class="lv-qw-attach-size">${m.sizeStr}</small>
                <button type="button" class="lv-qw-item-mode-btn" data-toggle="${m.id}" title="点击切换此文件的插入模式">${m.mode==="assets"?"💾 知识库":"🔗 本地链"}</button>
                <button type="button" class="lv-qw-attach-remove" data-del="${m.id}" title="移除附件">✕</button>
            </div>
        `).join(""),s.querySelectorAll("[data-toggle]").forEach(m=>{m.addEventListener("click",u=>{u.stopPropagation();let w=m.getAttribute("data-toggle"),x=E.find(M=>M.id===w);x&&(x.mode=x.mode==="assets"?"local-link":"assets",B())})}),s.querySelectorAll("[data-del]").forEach(m=>{m.addEventListener("click",u=>{u.stopPropagation();let w=m.getAttribute("data-del"),x=E.findIndex(M=>M.id===w);if(x>=0){let M=E[x];if(M){if(M.previewUrl)try{URL.revokeObjectURL(M.previewUrl)}catch{}se("/api/file/removeFile",{path:`/data/assets/${M.name}`}).catch(()=>{})}E.splice(x,1),B()}})}),O()}},k=m=>{for(let u of m){let w=u.type.startsWith("image/")?"image":u.type.startsWith("video/")?"video":"file",x=String(u.path||""),M=u.size>1024*1024?`${(u.size/(1024*1024)).toFixed(1)}MB`:`${Math.round(u.size/1024)}KB`,_=w==="image"?URL.createObjectURL(u):void 0;E.push({id:`att-${ae.now()}-${Math.random().toString(36).slice(2,6)}`,file:u,name:u.name,sizeStr:M,type:w,mode:S,localPath:x,previewUrl:_})}B(),oe(8)};Y.querySelector(".lv-qw-btn-img")?.addEventListener("click",()=>{F&&(F.accept="image/*",F.click())}),Y.querySelector(".lv-qw-btn-video")?.addEventListener("click",()=>{F&&(F.accept="video/*",F.click())}),Y.querySelector(".lv-qw-btn-file")?.addEventListener("click",()=>{F&&(F.accept="*/*",F.click())}),F?.addEventListener("change",()=>{F.files?.length&&(k(Array.from(F.files)),F.value="")}),y?.addEventListener("dragover",m=>{m.preventDefault(),y.classList.add("is-dragover")}),y?.addEventListener("dragleave",()=>{y.classList.remove("is-dragover")}),y?.addEventListener("drop",m=>{m.preventDefault(),y.classList.remove("is-dragover"),m.dataTransfer?.files?.length&&(k(Array.from(m.dataTransfer.files)),N.capsule({source:"LifeLog",message:`📎 已拖入 ${m.dataTransfer.files.length} 个文件`,duration:1800,archive:!1}))}),y?.addEventListener("paste",m=>{let u=m;u.clipboardData?.files?.length&&(k(Array.from(u.clipboardData.files)),N.capsule({source:"LifeLog",message:"📎 已添加剪贴板文件",duration:1800,archive:!1}))}),Y.querySelector(".lv-qw-tags-row")?.addEventListener("click",m=>{let u=m.target?.closest(".lv-qw-tag-chip");if(!u||!y)return;let w=u.getAttribute("data-insert")||"";oe(6);let x=w;if(w==="time")x=`${String(new ae().getHours()).padStart(2,"0")}:${String(new ae().getMinutes()).padStart(2,"0")} `;else if(w==="date"){let W=new ae;x=`${W.getFullYear()}-${String(W.getMonth()+1).padStart(2,"0")}-${String(W.getDate()).padStart(2,"0")} `}else w==="doclink"&&e&&(x=`[《${e.title}》](siyuan://blocks/${e.id}) `);let M=y.selectionStart??y.value.length,_=y.selectionEnd??y.value.length;y.value=y.value.slice(0,M)+x+y.value.slice(_),y.selectionStart=y.selectionEnd=M+x.length,y.dispatchEvent(new Re("input")),y.focus();try{n?.setItem(rt,y.value)}catch{}});let $=n?.getItem(rt);if($&&y&&(y.value=$,J)){let m=Number(n?.getItem(Tt)||0),u=J.querySelector(".lv-qw-draft-hint-text")||J.querySelector("span");if(u&&m>0){let w=new ae(m);u.textContent=`🌱 已恢复未保存草稿 · 存于 ${String(w.getHours()).padStart(2,"0")}:${String(w.getMinutes()).padStart(2,"0")}`}J.style.display="flex"}Y.addEventListener("click",m=>{m.target?.closest(".lv-qw-undo-btn")&&(m.stopPropagation(),xo(bn(),"LifeLog",()=>{let w=Y?.querySelector(".lv-qw-recent-strip");w&&(w.outerHTML=D())}))}),Y.querySelector(".lv-qw-draft-clear")?.addEventListener("click",()=>{re();try{n?.removeItem(rt),n?.removeItem(Tt)}catch{}y&&(y.value="",y.dispatchEvent(new Re("input"))),re(),J&&(J.style.display="none"),y?.focus()}),Y.addEventListener("click",m=>{let u=m.target?.closest(".lv-qw-attach-thumb img");if(u?.src){m.stopPropagation(),oe(6);let w=C.createElement("div");w.className="lv-qw-lightbox",w.style.cssText="position:fixed;inset:0;z-index:1150;background:rgba(0,0,0,0.85);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;cursor:zoom-out;animation:lvNoticeFadeIn .15s ease-out;",w.innerHTML=`<img src="${v(u.src)}" style="max-width:92vw;max-height:88vh;object-fit:contain;border-radius:8px;box-shadow:0 12px 36px rgba(0,0,0,0.5);" /><button type="button" class="lv-qw-lightbox-close" aria-label="关闭图片" title="关闭 (Esc)" style="position:absolute;top:16px;right:20px;font-size:24px;color:#fff;background:transparent;border:none;cursor:pointer;padding:8px;min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;">✕</button>`;let x=()=>{w.remove()};w.addEventListener("click",x),C.body.appendChild(w)}});let O=()=>{if(!pe)return;let m=E.filter(M=>M.type==="image").length,u=E.filter(M=>M.type!=="image").length,w=[];m&&w.push(`📷×${m}`),u&&w.push(`📎×${u}`);let x=w.length?` ${w.join(" ")}`:"";pe.textContent=`${P()} ${l}：${y?.value?.trim()||"..."}${x}`};O();let Z=()=>{let u=U?.querySelector(".lv-qw-add-cat-input")?.value?.trim();a=!1,u&&(o.includes(u)||(o.push(u),ze({lifeLogCategories:o})),l=u,oe(8)),U&&(U.innerHTML=j()),O(),y?.focus()};U?.addEventListener("keydown",m=>{let u=m;u.isComposing||u.keyCode===229||U.querySelector(".lv-qw-add-cat-input")&&(u.key==="Enter"?(u.preventDefault(),u.stopPropagation(),Z()):u.key==="Escape"&&(u.preventDefault(),u.stopPropagation(),a=!1,U.innerHTML=j(),y?.focus()))}),U?.addEventListener("click",m=>{let u=m.target;if(u?.closest(".lv-qw-add-cat-btn")){oe(8),a=!0,U.innerHTML=j(),q.setTimeout(()=>U.querySelector(".lv-qw-add-cat-input")?.focus(),20);return}if(u?.closest(".lv-qw-add-cat-confirm")){Z();return}if(u?.closest(".lv-qw-add-cat-cancel")){a=!1,U.innerHTML=j(),y?.focus();return}let w=u?.closest(".lv-qw-cat-del");if(w){m.stopPropagation();let M=w.getAttribute("data-del-cat"),_=M?o.indexOf(M):-1;_!==-1&&o.length>1&&(o.splice(_,1),l===M&&(l=o[0]||"日记"),ze({lifeLogCategories:o}),U.innerHTML=j(),O(),oe(6));return}let x=u?.closest(".lv-qw-cat-chip");x&&(U.querySelectorAll(".lv-qw-cat-chip").forEach(M=>M.classList.remove("active")),x.classList.add("active"),l=x.getAttribute("data-cat")||"日记",oe(6),O())}),de?.addEventListener("click",m=>{let u=m.target?.closest(".lv-qw-time-chip");u&&(de.querySelectorAll(".lv-qw-time-chip").forEach(w=>w.classList.remove("active")),u.classList.add("active"),i=parseInt(u.getAttribute("data-offset")||"0",10),oe(6),O())}),y?.addEventListener("keydown",m=>{if(!(m.isComposing||m.keyCode===229)&&m.key==="Tab"&&!m.shiftKey){m.preventDefault();let u=y.selectionStart??y.value.length,w=y.selectionEnd??y.value.length;y.value=y.value.slice(0,u)+"  "+y.value.slice(w),y.selectionStart=y.selectionEnd=u+2,y.dispatchEvent(new Re("input"))}}),y?.addEventListener("input",()=>{ne(),O()})}function Rn(t="topbar"){if(typeof C>"u")return;Se(),$e();let e=t,n=ft({icon:"⚙️",title:"小驴罗盘与全生态统一设置",badgeHtml:'<span class="lv-qw-badge">通用调度中枢</span>',bodyHtml:`
            <div class="lv-cfg-container" style="display:flex;width:100%;height:100%;min-height:0;flex:1 1 auto;">
                <div class="lv-cfg-sidebar"></div>
                <div class="lv-cfg-panel"></div>
            </div>
        `,primaryLabel:"保存并关闭",onSave:async(f,L)=>{L(),N.capsule({source:"罗盘设置",message:"✓ 设置已全部保存生效",duration:2200,level:"success",archive:!1})}});if(!n)return;let o=n.querySelector(".lv-qw-card");o&&(o.style.width="min(760px, 94vw)",o.style.maxWidth="760px",o.style.height="min(560px, 86vh)",o.style.maxHeight="560px",o.style.display="flex",o.style.flexDirection="column");let r=n.querySelector(".lv-qw-body");r&&(r.style.flex="1 1 auto",r.style.minHeight="0",r.style.padding="0",r.style.display="flex",r.style.overflow="hidden");let l=n.querySelector(".lv-qw-tip"),c=f=>{l&&(l.textContent=f||"✓ 已实时自动保存",l.style.color="var(--lv-lp-accent, #2563eb)",l.style.fontWeight="600",q.setTimeout(()=>{l&&(l.textContent=tt()?"点「保存并关闭」退出 · 修改已实时生效":"修改实时生效 · Esc 或点「保存并关闭」退出",l.style.color="",l.style.fontWeight="")},2200))},i=(f,L,y)=>{let A=h.find(Q=>Q.id===f);A&&A.render(L,y)},a=f=>{let L=je.getEnabledActions(!0).filter(A=>A.installed!==!1&&!A.destructive&&A.id!=="delete-block");return[`<option value="none" ${f==="none"?"selected":""}>🚫 关闭双击（仅单击展开菜单）</option>`,...L.map(A=>`<option value="${v(A.id)}" ${A.id===f?"selected":""}>${v(A.glyph||"⚡")} ${v(A.label)}</option>`)].join("")},d={"siyuan-checkin":"小驴打卡","siyuan-home":"小驴管家","siyuan-contacts":"小驴人脉","siyuan-glean":"小驴拾遗","siyuan-lv-cards":"小驴闪卡","siyuan-exam":"小驴考试","xiaolv-common":"小驴常用","siyuan-speed-switch":"小驴雷切"},p=()=>{let f=H.getLvEcosystemToggles(),L=Object.entries(d).map(([y,A])=>{let Q=f.aiSharedKeyAllowedPlugins?.[y]!==!1;return`<label style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:2px 7px;border-radius:6px;border:1px solid var(--lv-lp-border,rgba(15,23,42,0.12));background:var(--lv-lp-card-bg,#fff);cursor:pointer;">
                <input type="checkbox" class="lv-eco-ai-plugin-allow" data-plugin-id="${v(y)}" ${Q?"checked":""} />
                <span>${v(A)}</span>
            </label>`}).join("");return`
            <div class="lv-eco-controls-card" style="display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.12));margin-bottom:8px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                    <strong style="font-size:12.5px;color:var(--lv-lp-text);">🎛️ 生态共用能力总控（6 大独立开关）</strong>
                    <span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);">单仓插件可按需逐项关闭，即时生效</span>
                </div>
                <label style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;">
                    <span>① 块助手（默认关闭 · 400ms 零闪烁点选）</span>
                    <input type="checkbox" class="lv-eco-toggle" data-key="blockAssistant" ${f.blockAssistant?"checked":""} />
                </label>
                <label style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11.5px;padding-left:14px;color:var(--lv-lp-text-sub,#64748b);">
                    <span>↳ 仅用快捷键 Alt+B 唤醒（隐藏悬浮入口）</span>
                    <input type="checkbox" class="lv-eco-toggle" data-key="blockAssistantAltBOnly" ${f.blockAssistantAltBOnly?"checked":""} />
                </label>
                <label style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;">
                    <span>② 小驴罗盘总入口（顶栏磁贴 / 移动球 / 弹出坞）</span>
                    <input type="checkbox" class="lv-eco-toggle" data-key="launchpad" ${f.launchpad?"checked":""} />
                </label>
                <label style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;">
                    <span>③ 统一通知中心</span>
                    <input type="checkbox" class="lv-eco-toggle" data-key="noticeCenter" ${f.noticeCenter?"checked":""} />
                </label>
                <div style="display:flex;flex-wrap:wrap;gap:12px;padding-left:14px;font-size:11.5px;color:var(--lv-lp-text-sub,#64748b);">
                    <label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;">
                        <input type="checkbox" class="lv-eco-toggle" data-key="externalModalHarmonizer" ${f.externalModalHarmonizer?"checked":""} />
                        <span>第三方弹窗收拢哨兵</span>
                    </label>
                    <label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;">
                        <input type="checkbox" class="lv-eco-toggle" data-key="nativeMessageBridge" ${f.nativeMessageBridge?"checked":""} />
                        <span>原生 #message 接管</span>
                    </label>
                </div>
                <label style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;">
                    <span>④ 仅允许思源本体 AI（硬阻断一切外部模型与公用池外发）</span>
                    <input type="checkbox" class="lv-eco-toggle" data-key="aiSiyuanOnly" ${f.aiSiyuanOnly?"checked":""} />
                </label>
                <div style="padding-left:14px;display:flex;flex-direction:column;gap:4px;">
                    <span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);">↳ 共享 AI Key 按插件授权（取消勾选将拒绝读取共享密钥）：</span>
                    <div style="display:flex;flex-wrap:wrap;gap:5px;">${L}</div>
                </div>
                <label style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;">
                    <span>⑤ 活动流与日记联动（关闭后停采活动与停写日记）</span>
                    <input type="checkbox" class="lv-eco-toggle" data-key="activityLog" ${f.activityLog?"checked":""} />
                </label>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;">
                    <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
                        <input type="checkbox" class="lv-eco-toggle" data-key="autoSnapshotVault" ${f.autoSnapshotVault?"checked":""} />
                        <span>⑥ 8 仓共用跨机自动快照容灾</span>
                    </label>
                    <button type="button" class="lv-qw-tag-chip lv-eco-open-vault-wizard-btn" style="padding:2px 9px;font-size:11px;">🛡️ 打开恢复向导</button>
                </div>
            </div>
        `},g=(f,L)=>{f.querySelectorAll(".lv-eco-toggle").forEach(y=>{y.addEventListener("change",()=>{let A=y.getAttribute("data-key");if(!A)return;let Q=!!y.checked;if(H.setLvEcosystemToggles({[A]:Q}),A==="blockAssistant")try{je.setEnabled(Q)}catch{}L("✓ 生态总控开关已更新")})}),f.querySelectorAll(".lv-eco-ai-plugin-allow").forEach(y=>{y.addEventListener("change",()=>{let A=y.getAttribute("data-plugin-id");if(!A)return;let re={...H.getLvEcosystemToggles().aiSharedKeyAllowedPlugins||{},[A]:!!y.checked};H.setLvEcosystemToggles({aiSharedKeyAllowedPlugins:re}),L("✓ 共享 AI Key 插件授权已更新")})}),f.querySelector(".lv-eco-open-vault-wizard-btn")?.addEventListener("click",()=>{H.openVaultRestoreWizard?.()})},h=[{id:"topbar",title:"顶栏与罗盘",icon:"📌",render:(f,L)=>{let y=Ne(),A=y.getItems(),Q=je.isEnabled(),re=je.getDoubleClickActionId();f.innerHTML=p()+`
                    <div style="background:var(--lv-lp-accent-soft,rgba(37,99,235,0.08));border:1px solid rgba(37,99,235,0.2);padding:10px 14px;border-radius:8px;font-size:12px;line-height:1.6;color:var(--lv-lp-text,#0f172a);">
                        👋 <strong>顶栏与罗盘主权管理</strong>：自主决定哪些生态插件<strong>常驻在思源顶栏</strong>，哪些<strong>仅在罗盘坞内收敛</strong>，哪些<strong>彻底隐藏</strong>（仅保留快捷键/穿透搜索唤醒）。
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                            <div>
                                <strong style="font-size:12.5px;color:var(--lv-lp-text);display:block;">🧩 启用块助手（编辑器右缘浮标与 Alt+B 菜单）</strong>
                                <span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);">关闭后立即移除页面胶囊与浮层，且 Alt+B 不再弹出；装任意 1 个小驴插件即可完整使用</span>
                            </div>
                            <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;flex-shrink:0;font-size:12px;font-weight:600;color:var(--lv-lp-text);">
                                <input type="checkbox" class="lv-cfg-block-assistant-toggle" ${Q?"checked":""} />
                                <span class="lv-cfg-block-assistant-state">${Q?"已启用":"已停用"}</span>
                            </label>
                        </div>
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:8px;border-top:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
                            <div>
                                <strong style="font-size:12px;color:var(--lv-lp-text);display:block;">双击胶囊/快捷入口触发动作</strong>
                                <span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);">双击块助手胶囊时直接执行的高频动作（仅含当前已启用动作）</span>
                            </div>
                            <select class="lv-cfg-ba-dblclick-select" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);padding:4px 8px;border-radius:6px;font-size:12px;cursor:pointer;flex-shrink:0;max-width:220px;">
                                ${a(re)}
                            </select>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px;flex-wrap:wrap;">
                        <div style="font-weight:700;font-size:12.5px;color:var(--lv-lp-accent,#2563eb);">📌 生态插件列表、排序与驻留形态</div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;">
                            <button type="button" class="lv-qw-tag-chip lv-cfg-reset-order-btn" style="padding:3px 9px;font-size:11px;color:var(--lv-lp-text-sub);">↺ 恢复默认顺序</button>
                            <button type="button" class="lv-qw-tag-chip lv-cfg-all-pinned-btn" style="padding:3px 9px;font-size:11px;color:var(--lv-lp-accent);">📌 全部平铺到顶栏</button>
                            <button type="button" class="lv-qw-tag-chip lv-cfg-all-docked-btn" style="padding:3px 9px;font-size:11px;color:var(--lv-lp-accent);">📥 全部收敛到罗盘</button>
                        </div>
                    </div>
                    <div class="lv-cfg-plugins-list" style="display:flex;flex-direction:column;gap:6px;">
                        ${A.map((U,de)=>{let J=v(U.id),le=v(U.fullName&&!U.fullName.includes("<")?U.fullName:U.name||U.id),b=nt(U.id,U.color),K=Wt(U.id,16),ue=de===0,ge=de===A.length-1;return`
                                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));flex-wrap:wrap;">
                                    <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1 1 160px;">
                                        <span style="color:${b};display:inline-flex;align-items:center;flex-shrink:0;">${K}</span>
                                        <div style="display:flex;flex-direction:column;gap:1px;min-width:0;">
                                            <strong style="font-size:13px;color:var(--lv-lp-text);">${le}</strong>
                                            <span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v(U.desc||"")}</span>
                                        </div>
                                    </div>
                                    <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
                                        <button type="button" class="lv-qw-tag-chip lv-cfg-order-up-btn" data-order-id="${J}" title="上移磁贴" aria-label="上移" ${ue?"disabled":""} style="padding:3px 7px;font-size:11px;min-width:26px;opacity:${ue?"0.4":"1"};">↑</button>
                                        <button type="button" class="lv-qw-tag-chip lv-cfg-order-down-btn" data-order-id="${J}" title="下移磁贴" aria-label="下移" ${ge?"disabled":""} style="padding:3px 7px;font-size:11px;min-width:26px;opacity:${ge?"0.4":"1"};">↓</button>
                                        <select class="lv-cfg-state-select" data-plugin-id="${J}" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);padding:4px 8px;border-radius:6px;font-size:12px;cursor:pointer;flex-shrink:0;max-width:155px;">
                                            <option value="docked" ${U.state==="docked"?"selected":""}>📥 仅在罗盘坞内 (顶栏隐藏)</option>
                                            <option value="pinned" ${U.state==="pinned"?"selected":""}>📌 置顶在外 (顶栏+坞内同时显示)</option>
                                            <option value="hidden" ${U.state==="hidden"?"selected":""}>👁️ 彻底隐藏 (仅快捷键唤醒)</option>
                                        </select>
                                    </div>
                                </div>
                            `}).join("")}
                    </div>
                `,g(f,L);let fe=f.querySelector(".lv-cfg-block-assistant-toggle"),ne=f.querySelector(".lv-cfg-block-assistant-state"),Y=U=>{fe&&(fe.checked=U),ne&&(ne.textContent=U?"已启用":"已停用")};if(fe?.addEventListener("change",()=>{let U=!!fe.checked;je.setEnabled(U),Y(U),L(U?"✓ 已启用块助手":"✓ 已停用并清理块助手")}),typeof q<"u"){let U=de=>{if(!f.isConnected){q.removeEventListener("lv-block-assistant-toggle",U);return}let J=de?.detail?.enabled;Y(typeof J=="boolean"?J:je.isEnabled())};q.addEventListener("lv-block-assistant-toggle",U)}let pe=f.querySelector(".lv-cfg-ba-dblclick-select");pe?.addEventListener("change",()=>{let U=je.setDoubleClickActionId(pe.value);pe.value=U,L(U==="none"?"✓ 已关闭胶囊双击触发":"✓ 双击触发动作已保存")}),f.querySelectorAll(".lv-cfg-state-select").forEach(U=>{U.addEventListener("change",()=>{let de=U.getAttribute("data-plugin-id"),J=U.value;de&&(J==="pinned"||J==="docked"||J==="hidden")&&(y.setPluginState(de,J),pt(),L("✓ 图标状态已更新"))})}),f.querySelectorAll(".lv-cfg-order-up-btn").forEach(U=>{U.addEventListener("click",()=>{let de=U.getAttribute("data-order-id");de&&y.movePluginOrder?.(de,"up")&&(i("topbar",f,L),L("✓ 磁贴已上移"))})}),f.querySelectorAll(".lv-cfg-order-down-btn").forEach(U=>{U.addEventListener("click",()=>{let de=U.getAttribute("data-order-id");de&&y.movePluginOrder?.(de,"down")&&(i("topbar",f,L),L("✓ 磁贴已下移"))})}),f.querySelector(".lv-cfg-reset-order-btn")?.addEventListener("click",()=>{y.resetPluginOrder?.(),i("topbar",f,L),L("✓ 已恢复默认顺序")}),f.querySelector(".lv-cfg-all-pinned-btn")?.addEventListener("click",()=>{y.getItems().forEach(U=>y.setPluginState(U.id,"pinned")),pt(),i("topbar",f,L),L("✓ 已全部平铺至顶栏")}),f.querySelector(".lv-cfg-all-docked-btn")?.addEventListener("click",()=>{y.getItems().forEach(U=>y.setPluginState(U.id,"docked")),pt(),i("topbar",f,L),L("✓ 已全部收敛至罗盘")})}},{id:"block-assistant",title:"块助手",icon:"🧩",render:(f,L)=>{let y=je.isEnabled(),A=je.getDoubleClickActionId();f.innerHTML=`
                    <div style="background:var(--lv-lp-accent-soft,rgba(37,99,235,0.08));border:1px solid rgba(37,99,235,0.2);padding:10px 14px;border-radius:8px;font-size:12px;line-height:1.6;color:var(--lv-lp-text,#0f172a);">
                        🧩 <strong>全能块助手（1–8 任意插件原生底座）</strong>：装任意 1 个小驴插件即可享用完整思源本体块增强（默认「🔄 转换块类型」+ 聚焦/引用/折叠/克隆），并按已装插件动态装配专属跨插件流转。
                    </div>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));">
                            <div>
                                <strong style="font-size:12.5px;color:var(--lv-lp-text);display:block;">启用块助手（悬浮胶囊与 Alt+B 菜单）</strong>
                                <span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);">关闭后立即卸载页面胶囊且 Alt+B 不再弹出</span>
                            </div>
                            <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;flex-shrink:0;font-size:12px;font-weight:600;color:var(--lv-lp-text);">
                                <input type="checkbox" class="lv-cfg-block-assistant-toggle" ${y?"checked":""} />
                                <span class="lv-cfg-block-assistant-state">${y?"已启用":"已停用"}</span>
                            </label>
                        </div>
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));">
                            <div>
                                <strong style="font-size:12.5px;color:var(--lv-lp-text);display:block;">双击胶囊/快捷入口触发动作</strong>
                                <span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);">默认「🔄 转换块类型」，支持改为任意已启用动作或关闭双击</span>
                            </div>
                            <select class="lv-cfg-ba-dblclick-select" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text,#0f172a);padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;max-width:240px;">
                                ${a(A)}
                            </select>
                        </div>
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:8px;border-top:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
                            <div>
                                <strong style="font-size:12.5px;color:var(--lv-lp-text);display:block;">动作资产库与 5 槽常驻排序</strong>
                                <span style="font-size:11px;color:var(--lv-lp-text-sub,#64748b);">自定义启用动作、置顶常驻槽位与声明式快捷指令</span>
                            </div>
                            <button type="button" class="lv-qw-tag-chip lv-cfg-open-ba-store-btn" style="padding:5px 12px;font-size:12px;font-weight:600;color:var(--lv-lp-accent,#2563eb);background:var(--lv-lp-accent-soft,rgba(37,99,235,0.1));">📦 打开块助手资产库</button>
                        </div>
                    </div>
                `;let Q=f.querySelector(".lv-cfg-block-assistant-toggle"),re=f.querySelector(".lv-cfg-block-assistant-state");Q?.addEventListener("change",()=>{let ne=!!Q.checked;je.setEnabled(ne),re&&(re.textContent=ne?"已启用":"已停用"),L(ne?"✓ 已启用块助手":"✓ 已停用并清理块助手")});let fe=f.querySelector(".lv-cfg-ba-dblclick-select");fe?.addEventListener("change",()=>{let ne=je.setDoubleClickActionId(fe.value);fe.value=ne,L(ne==="none"?"✓ 已关闭胶囊双击触发":"✓ 双击触发动作已保存")}),f.querySelector(".lv-cfg-open-ba-store-btn")?.addEventListener("click",()=>{je.openStoreDialog({onConfigChange:()=>{f.isConnected&&i("block-assistant",f,L)}})})}},{id:"workspace",title:"极速工作台",icon:"⚡",render:(f,L)=>{let y=Qe(),A=no(),Q=xt(),re=y.lifeLogCategories||un,fe=["日记","工作","家庭","思考","记录","读书","复盘","灵感","健康"];f.innerHTML=`
                    <div style="background:var(--lv-lp-accent-soft,rgba(37,99,235,0.08));border:1px solid rgba(37,99,235,0.2);padding:10px 14px;border-radius:8px;font-size:12px;line-height:1.6;color:var(--lv-lp-text,#0f172a);">
                        ⚡ <strong>极速工作台与随手记</strong>：全局快捷键 N (一键记事)、L (叶归 LifeLog)、V (剪贴入库) 以及手机端悬浮球的核心配置。
                    </div>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <div style="display:flex;flex-direction:column;gap:6px;">
                            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                                <strong style="font-size:12.5px;color:var(--lv-lp-text);">LifeLog 分类流（逗号分隔）</strong>
                                <span style="font-size:11px;color:var(--lv-lp-text-sub);">点击下方常用标签可直接追加</span>
                            </div>
                            <input type="text" class="lv-cfg-lifelog-cats b3-text-field" value="${v(re.join(", "))}" style="font-size:12px;padding:6px 10px;border-radius:6px;background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text);" />
                            <div class="lv-cfg-cat-chips" style="display:flex;gap:5px;flex-wrap:wrap;margin-top:2px;">
                                ${fe.map(J=>`<button type="button" class="lv-qw-tag-chip lv-cfg-add-cat-btn" data-cat="${v(J)}" style="padding:2px 7px;font-size:11px;${re.includes(J)?"background:var(--lv-lp-accent-soft);color:var(--lv-lp-accent);font-weight:600;":""}">${v(J)}</button>`).join("")}
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:8px;border-top:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
                            <div>
                                <strong style="font-size:12.5px;color:var(--lv-lp-text);display:block;">日记目标笔记本</strong>
                                <span style="font-size:11px;color:var(--lv-lp-text-sub);">新写日记或追加 LifeLog 时默认定位的笔记本</span>
                            </div>
                            <select class="lv-cfg-nb-select" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text);padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;max-width:240px;">
                                <option value="">✨ 自动识别默认日记本</option>
                                ${y.lifeLogNotebookId?`<option value="${v(y.lifeLogNotebookId)}" selected>📔 已选笔记本</option>`:""}
                            </select>
                        </div>
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:8px;border-top:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
                            <div>
                                <strong style="font-size:12.5px;color:var(--lv-lp-text);display:block;">📔 日记小驴记录区默认折叠</strong>
                                <span style="font-size:11px;color:var(--lv-lp-text-sub);">开启后各插件写入当日日记的记录自动收敛在折叠的「🐴 小驴记录」区，不干扰手写日记</span>
                            </div>
                            <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;flex-shrink:0;font-size:12px;font-weight:600;color:var(--lv-lp-text);">
                                <input type="checkbox" class="lv-cfg-diary-zone-fold-toggle" ${A.defaultFolded?"checked":""} />
                                <span class="lv-cfg-diary-zone-fold-state">${A.defaultFolded?"默认折叠":"默认展开"}</span>
                            </label>
                        </div>
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:8px;border-top:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
                            <div>
                                <strong style="font-size:12.5px;color:var(--lv-lp-text);display:block;">标题级别：四级(默认)/三级</strong>
                                <span style="font-size:11px;color:var(--lv-lp-text-sub);">当日日记「🐴 小驴记录」分区的标题层级（已移动位置或既有分区保持原位置不重复创建）</span>
                            </div>
                            <select class="lv-cfg-diary-zone-level-select" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text);padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;max-width:240px;">
                                <option value="4" ${A.headingLevel===4?"selected":""}>四级标题 #### 🐴 小驴记录（默认）</option>
                                <option value="3" ${A.headingLevel===3?"selected":""}>三级标题 ### 🐴 小驴记录</option>
                            </select>
                        </div>
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:8px;border-top:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
                            <div>
                                <strong style="font-size:12.5px;color:var(--lv-lp-text);display:block;">手机端罗盘入口形态</strong>
                                <span style="font-size:11px;color:var(--lv-lp-text-sub);">移动端思源上的入口呈现（双击悬浮球可瞬发闪记）</span>
                            </div>
                            <select class="lv-cfg-mobile-mode-select" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text);padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;max-width:240px;">
                                <option value="both" ${Q==="both"?"selected":""}>🔘 悬浮球 + 顶栏按钮 (推荐)</option>
                                <option value="ball" ${Q==="ball"?"selected":""}>🎯 仅悬浮球</option>
                                <option value="topbar" ${Q==="topbar"?"selected":""}>📌 仅顶栏按钮</option>
                                <option value="none" ${Q==="none"?"selected":""}>🙈 隐藏手机端入口</option>
                            </select>
                        </div>
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:8px;border-top:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
                            <div>
                                <strong style="font-size:12.5px;color:var(--lv-lp-text);display:block;">一键记事附件保存方式</strong>
                                <span style="font-size:11px;color:var(--lv-lp-text-sub);">随手粘贴或拖入的截图与照片存储策略</span>
                            </div>
                            <select class="lv-cfg-attach-mode-select" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text);padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;max-width:240px;">
                                <option value="assets" ${y.quickNoteAttachMode!=="local-link"?"selected":""}>📁 统一存入思源 assets 资源库 (推荐)</option>
                                <option value="local-link" ${y.quickNoteAttachMode==="local-link"?"selected":""}>🔗 本地相对文件链接</option>
                            </select>
                        </div>
                    </div>
                `;let ne=f.querySelector(".lv-cfg-lifelog-cats"),Y=()=>{if(!ne)return;let J=ne.value.split(/[,，]/).map(le=>le.trim()).filter(Boolean);J.length>0&&(ze({lifeLogCategories:J}),L("✓ 分类已保存"))};ne?.addEventListener("change",Y),f.querySelectorAll(".lv-cfg-add-cat-btn").forEach(J=>{J.addEventListener("click",()=>{let le=J.getAttribute("data-cat");if(!le||!ne)return;let b=ne.value.split(/[,，]/).map(K=>K.trim()).filter(Boolean);b.includes(le)||(b.push(le),ne.value=b.join(", "),Y(),i("workspace",f,L))})});let pe=f.querySelector(".lv-cfg-diary-zone-fold-toggle"),U=f.querySelector(".lv-cfg-diary-zone-fold-state");pe?.addEventListener("change",()=>{let J=!!pe.checked;oo({defaultFolded:J}),U&&(U.textContent=J?"默认折叠":"默认展开"),L(J?"✓ 日记小驴记录区已设为默认折叠":"✓ 日记小驴记录区已设为默认展开")}),f.querySelector(".lv-cfg-diary-zone-level-select")?.addEventListener("change",J=>{let le=Number(J.target.value)===3?3:4;oo({headingLevel:le}),L(`✓ 小驴记录区标题级别已设为${le===3?"三级":"四级"}`)});let de=f.querySelector(".lv-cfg-nb-select");de&&(lt().then(J=>{!de.isConnected||!J.length||(de.innerHTML='<option value="">✨ 自动识别默认日记本</option>'+J.map(le=>`<option value="${v(le.id)}" ${le.id===y.lifeLogNotebookId?"selected":""}>📔 ${v(le.name)}</option>`).join(""))}).catch(()=>{}),de.addEventListener("change",()=>{let J=de.value.trim();ze({lifeLogNotebookId:J||void 0,diaryNotebookId:J||void 0,quickNoteNotebookId:J||void 0}),L("✓ 目标日记本已更新")})),f.querySelector(".lv-cfg-mobile-mode-select")?.addEventListener("change",J=>{let le=J.target.value;(le==="both"||le==="ball"||le==="topbar"||le==="none")&&(dn(le),L("✓ 手机端入口已保存"))}),f.querySelector(".lv-cfg-attach-mode-select")?.addEventListener("change",J=>{let le=J.target.value;ze({quickNoteAttachMode:le}),L("✓ 附件存储策略已保存")})}},{id:"appearance",title:"动态与庆祝",icon:"🎨",render:f=>{f.innerHTML=`
                    <div style="background:var(--lv-lp-accent-soft,rgba(37,99,235,0.08));border:1px solid rgba(37,99,235,0.2);padding:10px 14px;border-radius:8px;font-size:12px;line-height:1.6;color:var(--lv-lp-text,#0f172a);margin-bottom:8px;">
                        🎨 <strong>全生态动态与庆祝效果</strong>：集中管理减弱动态效果与关闭庆祝撒花，对本机全部小驴插件生效，各单插件不再重复设置。
                    </div>
                    <div class="lv-cfg-uiprefs-mount"></div>
                `;let L=f.querySelector(".lv-cfg-uiprefs-mount"),y=typeof q<"u"&&q.LvUiPrefs||null;L&&y&&typeof y.createLvUiPrefsSection=="function"?L.appendChild(y.createLvUiPrefsSection({scope:"ecosystem"})):L&&(L.innerHTML=`
                        <div style="padding:16px;border-radius:8px;background:var(--lv-lp-panel-bg);border:1px solid var(--lv-lp-border);font-size:12px;color:var(--lv-lp-text-sub);">
                            已接入全生态统一偏好键（lv_ui_prefs_v1），支持动效总档（完整/精简/关闭）与庆祝效果自主配置。
                        </div>
                    `)}},{id:"ai",title:"AI 调度中枢",icon:"🤖",render:(f,L)=>{try{jo().getConfig()}catch{}let y=typeof q<"u"&&q.loadAiRouterConfig||null,A=typeof q<"u"&&q.saveAiRouterConfig||null,Q=()=>typeof y=="function"?y():{enableSiyuan:!0,enableRuleFallback:!0,publicFree:{enabled:!1},ollama:{enabled:!0,baseUrl:"http://127.0.0.1:11434"}},re=ne=>{let Y=Q(),pe=Y.preferredProvider||"auto",U=typeof ne?.buildAiWaterfallFlowchartHtml=="function"?ne.buildAiWaterfallFlowchartHtml(pe):"",de=typeof ne?.buildAiTierCardsHtml=="function"?ne.buildAiTierCardsHtml(Y,!1):"";f.innerHTML=`
                        <div class="lv-ai-hub-container">
                            <div style="background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.2);padding:10px 14px;border-radius:8px;font-size:12px;line-height:1.6;color:var(--lv-lp-text);">
                                🤖 <strong>全生态统一 AI 调度中枢</strong>：在此配置一次，闪卡拟题、考试分析、打卡解析、罗盘对账等 8 大官方插件<strong>全域即刻生效</strong>。默认五级智能阶梯切换（思源智能体 ➔ 自配密钥 ➔ 本地 Ollama ➔ 免费通道 ➔ 离线规则）。
                            </div>
                            ${U}
                            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));flex-wrap:wrap;gap:8px;">
                                <div>
                                    <strong style="font-size:12.5px;color:var(--lv-lp-text);display:block;">首选通道模式</strong>
                                    <span style="font-size:11px;color:var(--lv-lp-text-sub);">优先尝试的 AI 推理后端，异常或离线时自动按上方五级阶梯瀑布降级</span>
                                </div>
                                <select class="lv-cfg-ai-pref-provider" style="background:var(--lv-lp-card-bg,#fff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));color:var(--lv-lp-text);padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;max-width:240px;">
                                    <option value="auto" ${pe==="auto"?"selected":""}>🌊 五级自适应瀑布流 (推荐)</option>
                                    <option value="siyuan" ${pe==="siyuan"?"selected":""}>🟢 优先思源内核智能体</option>
                                    <option value="user_custom" ${pe==="user_custom"?"selected":""}>🔵 优先自填 Key (OpenAI兼容)</option>
                                    <option value="ollama" ${pe==="ollama"?"selected":""}>🟣 优先本地 Ollama (100%离线)</option>
                                    <option value="public_free" ${pe==="public_free"?"selected":""}>🌐 优先免密免费通道</option>
                                    <option value="rule_fallback" ${pe==="rule_fallback"?"selected":""}>⚡ 强制纯离线规则 (无网络)</option>
                                </select>
                            </div>
                            ${de}
                        </div>
                    `;let J=()=>{if(typeof y!="function"||typeof A!="function")return;let le=y(),b=f.querySelector(".lv-cfg-ai-pref-provider")?.value||"auto",K=f.querySelector(".lv-cfg-ai-custom-url")?.value.trim()||void 0,ue=f.querySelector(".lv-cfg-ai-custom-key"),ge=ue?.value.trim()||"",z=f.querySelector(".lv-cfg-ai-custom-model")?.value.trim()||void 0,G=f.querySelector(".lv-cfg-ai-ollama-url")?.value.trim()||void 0,F=!!f.querySelector(".lv-cfg-ai-public-free-toggle")?.checked;if(ge){let I=typeof q<"u"&&q.saveTier2SecretToHost||null;(typeof I=="function"?Promise.resolve(I(ge)):Kn(ge)).then(k=>{if(k?.ok){try{if(typeof We<"u"){let O=We.getItem("lv_ai_router_config_v1");if(O){let Z=JSON.parse(O);Z?.userCustom&&"apiKey"in Z.userCustom&&(delete Z.userCustom.apiKey,Z.userCustom.hasSecret=!0,We.setItem("lv_ai_router_config_v1",JSON.stringify(Z)))}}}catch{}let $=y();$?.userCustom&&delete $.userCustom.apiKey,$.userCustom={...$.userCustom||{},hasSecret:!0,secretSlot:"lv_ai_secret_tier2_apikey"},A($),ue&&(ue.value="",ue.placeholder="•••••••• (已安全存入思源密钥库，留空保持不变)",ue.setAttribute("data-has-secret","true"))}}).catch(()=>{})}let s=!!(typeof q<"u"&&q.hasTier2SecretConfigured?.());le.preferredProvider=b==="auto"?void 0:b,le.userCustom={...le.userCustom||{},baseUrl:K,model:z,hasSecret:s,secretSlot:"lv_ai_secret_tier2_apikey"},delete le.userCustom.apiKey,le.ollama={...le.ollama||{},baseUrl:G},le.publicFree={...le.publicFree||{},enabled:F},A(le)};ne?.attachAiHubEventListeners?.(f,J,L)},fe=H.getAiHubUi?.();if(fe&&typeof fe.buildAiWaterfallFlowchartHtml=="function"){re(fe);return}if(f.innerHTML=`
                    <div class="lv-ai-hub-container">
                        <div style="background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.2);padding:10px 14px;border-radius:8px;font-size:12px;line-height:1.6;color:var(--lv-lp-text);">
                            🤖 <strong>全生态统一 AI 调度中枢</strong>：在此配置一次，闪卡拟题、考试分析、打卡解析、罗盘对账等 8 大官方插件<strong>全域即刻生效</strong>。默认五级智能阶梯切换（思源智能体 ➔ 自配密钥 ➔ 本地 Ollama ➔ 免费通道 ➔ 离线规则）。
                        </div>
                        <div class="lv-ai-hub-loading" style="padding:28px 16px;text-align:center;border-radius:10px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px dashed var(--lv-lp-border,rgba(15,23,42,0.12));color:var(--lv-lp-text-sub,#64748b);font-size:12.5px;">
                            ⏳ 正在加载 AI 调度中枢…
                        </div>
                    </div>
                `,typeof H.loadAiHubUi=="function")H.loadAiHubUi().then(ne=>{if(!(!f.isConnected||e!=="ai"))if(ne&&typeof ne.buildAiWaterfallFlowchartHtml=="function")re(ne);else{let Y=f.querySelector(".lv-ai-hub-loading");Y&&(Y.textContent="⚠️ AI 调度中枢分包暂不可用，请检查插件资源目录后重试。")}}).catch(()=>{if(!f.isConnected||e!=="ai")return;let ne=f.querySelector(".lv-ai-hub-loading");ne&&(ne.textContent="⚠️ 暂无法加载 AI 调度中枢（离线或分包加载失败），请稍后重试。")});else{let ne=f.querySelector(".lv-ai-hub-loading");ne&&(ne.textContent="⚠️ AI 调度中枢分包加载接口未就绪，请更新底座后重试。")}}},{id:"notice",title:"通知与免打扰",icon:"🔕",render:(f,L)=>{let y=bt(),A=nn(),Q=N.getMutedCategories?N.getMutedCategories():[],re=N.getHistory(),fe=N.getUnreadCount();f.innerHTML=`
                    <div style="background:var(--lv-lp-accent-soft,rgba(37,99,235,0.08));border:1px solid rgba(37,99,235,0.2);padding:10px 14px;border-radius:8px;font-size:12px;line-height:1.6;color:var(--lv-lp-text,#0f172a);">
                        🔕 <strong>四级渐进降噪与长效免打扰</strong>：微动效 ➔ 瞬时微胶囊 ➔ 交互卡片 ➔ 静默留档。支持按分类长效静音或开启全局专注。
                    </div>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));">
                            <div>
                                <strong style="font-size:13px;color:var(--lv-lp-text);display:block;">🌙 全局专注模式</strong>
                                <span style="font-size:11.5px;color:var(--lv-lp-text-sub);">${y?`当前处于专注模式（静音至 ${new ae(A).toTimeString().slice(0,5)}）`:"开启后全生态交互卡片与微胶囊将静音留存至历史，不打扰沉浸思考"}</span>
                            </div>
                            <button type="button" class="lv-qw-tag-chip lv-cfg-toggle-focus-btn" style="padding:4px 12px;font-size:12px;font-weight:600;${y?"color:#ef4444;background:rgba(239,68,68,0.08);":"color:var(--lv-lp-accent);background:var(--lv-lp-accent-soft);"}">
                                ${y?"退出专注模式":"开启专注模式"}
                            </button>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:6px;">
                            <div style="display:flex;align-items:center;justify-content:space-between;">
                                <strong style="font-size:12.5px;color:var(--lv-lp-text);">🔕 已设免打扰提醒分类 (${Q.length})</strong>
                                ${Q.length>0?'<button type="button" class="lv-qw-tag-chip lv-cfg-clear-all-mute-btn" style="padding:2px 8px;font-size:11px;color:#ef4444;">清空全部免打扰</button>':""}
                            </div>
                            ${Q.length===0?`
                                <div style="padding:14px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px dashed var(--lv-lp-border,rgba(15,23,42,0.1));font-size:12px;color:var(--lv-lp-text-sub);text-align:center;">当前无任何被静音的分类，所有生态提醒均正常送达。</div>
                            `:`
                                <div style="display:flex;flex-direction:column;gap:4px;">
                                    ${Q.map(ne=>`
                                        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:6px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));font-size:12px;">
                                            <div>
                                                <strong style="color:var(--lv-lp-text);">${v(ne.category)}</strong>
                                                <span style="font-size:11px;color:var(--lv-lp-text-sub);margin-left:8px;">静音至 ${v(ne.untilStr)}</span>
                                            </div>
                                            <button type="button" class="lv-qw-tag-chip lv-cfg-unmute-cat-btn" data-cat="${v(ne.category)}" style="padding:2px 8px;font-size:11px;color:var(--lv-lp-accent);">解除静音</button>
                                        </div>
                                    `).join("")}
                                </div>
                            `}
                        </div>
                        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px dashed var(--lv-lp-border,rgba(15,23,42,0.08));">
                            <div>
                                <strong style="font-size:12.5px;color:var(--lv-lp-text);display:block;">通知中心收件箱历史</strong>
                                <span style="font-size:11.5px;color:var(--lv-lp-text-sub);">已留存 ${re.length} 条通知记录 · 其中 ${fe} 条未读</span>
                            </div>
                            <div style="display:flex;gap:6px;">
                                <button type="button" class="lv-qw-tag-chip lv-cfg-mark-all-read-btn" style="padding:3px 9px;font-size:11.5px;color:var(--lv-lp-accent);">全部标记已读</button>
                                <button type="button" class="lv-qw-tag-chip lv-cfg-clear-history-btn" style="padding:3px 9px;font-size:11.5px;color:#ef4444;">清空历史记录</button>
                            </div>
                        </div>
                    </div>
                `,f.querySelector(".lv-cfg-toggle-focus-btn")?.addEventListener("click",()=>{if(bt())an(),oe(8),L("已退出专注模式");else{let ne=new ae,Y=new ae(ne);Y.setHours(23,0,0,0),Y.getTime()<=ne.getTime()&&Y.setTime(ne.getTime()+2*36e5),on(Y.getTime()),oe(10),L(`已开启专注模式至 ${Y.toTimeString().slice(0,5)}`)}i("notice",f,L),Ye()}),f.querySelectorAll(".lv-cfg-unmute-cat-btn").forEach(ne=>{ne.addEventListener("click",()=>{let Y=ne.getAttribute("data-cat");Y&&(N.clearCategoryMute(Y),L(`已恢复「${Y}」正常提醒`),i("notice",f,L))})}),f.querySelector(".lv-cfg-clear-all-mute-btn")?.addEventListener("click",()=>{Q.forEach(ne=>N.clearCategoryMute(ne.category)),L("已清空全部免打扰设置"),i("notice",f,L)}),f.querySelector(".lv-cfg-mark-all-read-btn")?.addEventListener("click",()=>{N.markAllRead(),L("已全部标为已读"),i("notice",f,L),Ye()}),f.querySelector(".lv-cfg-clear-history-btn")?.addEventListener("click",()=>{N.clearHistory(),L("已清空通知历史记录"),i("notice",f,L),Ye()})}},{id:"automation",title:"自动化联动",icon:"🔄",render:(f,L)=>{let y=Kt.getRules();f.innerHTML=`
                    <div style="background:var(--lv-lp-accent-soft,rgba(37,99,235,0.08));border:1px solid rgba(37,99,235,0.2);padding:10px 14px;border-radius:8px;font-size:12px;line-height:1.6;color:var(--lv-lp-text,#0f172a);">
                        🔄 <strong>跨插件智能自动化规则 (IFTTT)</strong>：罗盘统一纳管各插件注册的跨插件联动事件。
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        ${y.length===0?`
                            <div style="padding:20px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px dashed var(--lv-lp-border,rgba(15,23,42,0.1));font-size:12px;color:var(--lv-lp-text-sub);text-align:center;">
                                暂无活跃的跨插件自动化规则。<br><span style="font-size:11px;opacity:0.8;">打卡、闪卡、拾遗等插件在启动并开启对应联动时，规则将在此自动聚合管控。</span>
                            </div>
                        `:y.map(A=>`
                            <label style="padding:9px 12px;border-radius:8px;background:var(--lv-lp-panel-bg,#f8fafc);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;">
                                <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
                                    <strong style="font-size:13px;color:var(--lv-lp-text);">${v(A.name)}</strong>
                                    <span style="font-size:11px;color:var(--lv-lp-text-sub);">${v(A.desc||`${A.triggerSource} ➔ ${A.actionPlugin}`)}</span>
                                </div>
                                <input type="checkbox" class="lv-cfg-rule-toggle" data-rule-id="${v(A.id)}" ${A.enabled?"checked":""} style="cursor:pointer;flex-shrink:0;width:18px;height:18px;" />
                            </label>
                        `).join("")}
                    </div>
                `,f.querySelectorAll(".lv-cfg-rule-toggle").forEach(A=>{A.addEventListener("change",()=>{let Q=A.getAttribute("data-rule-id");Q&&(Kt.toggleRule(Q,!!A.checked),L(A.checked?"✓ 规则已启用":"✓ 规则已停用"))})})}}],T=[...h,...va],E=T.find(f=>f.id===e)||T[0];E&&(e=E.id);let S=n.querySelector(".lv-cfg-sidebar"),P=n.querySelector(".lv-cfg-panel"),j=()=>{S&&(S.innerHTML=T.map(f=>`
            <button type="button" class="lv-cfg-tab-btn ${f.id===e?"active":""}" data-cfg-tab="${f.id}">
                <span>${f.icon}</span>
                <span>${v(f.title)}</span>
                ${f.badge?`<span style="font-size:10px;padding:1px 5px;border-radius:10px;background:rgba(37,99,235,0.1);color:#2563eb;margin-left:auto;">${v(f.badge)}</span>`:""}
            </button>
        `).join(""),S.querySelectorAll(".lv-cfg-tab-btn").forEach(f=>{f.addEventListener("click",()=>{let L=f.getAttribute("data-cfg-tab");L&&L!==e&&(oe(6),e=L,j(),D())})}))},D=()=>{if(!P)return;P.innerHTML="";let f=T.find(L=>L.id===e)||T[0];f&&f.render(P,c)};j(),D()}function _n(){if(typeof C>"u")return;try{Ge?.pop?.("lv-sponsor-modal")}catch{}let t=C.getElementById("lv-sponsor-modal-mask");if(t)try{t.remove()}catch{}let n=`${H.resolveLvAssetBase?H.resolveLvAssetBase():"./"}lv-sponsor-card.png`,o=C.createElement("div");o.id="lv-sponsor-modal-mask",o.setAttribute("role","dialog"),o.setAttribute("aria-modal","true"),o.setAttribute("aria-label","为小飞驴投喂 Token 算力"),o.style.cssText="position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.58);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;animation:lvNoticeFadeIn 0.16s ease-out both;";let r=C.createElement("div");r.style.cssText="position:relative;background:var(--lv-lp-card-bg,#ffffff);border:1px solid var(--lv-lp-border-strong,rgba(15,23,42,0.14));border-radius:18px;box-shadow:0 20px 48px -12px rgba(15,23,42,0.28);max-width:min(92vw,680px);max-height:min(92vh,840px);overflow-y:auto;padding:20px 22px;display:flex;flex-direction:column;align-items:center;gap:14px;box-sizing:border-box;",r.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:rgba(234,179,8,0.15);color:#eab308;font-size:16px;">⚡</span>
                <strong style="font-size:15px;color:var(--lv-lp-text,#0f172a);">为小飞驴投喂 Token 算力</strong>
            </div>
            <button type="button" class="lv-sponsor-close-btn" style="border:none;background:var(--lv-lp-panel-bg,#f1f5f9);color:var(--lv-lp-text-sub,#64748b);width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;" title="关闭">✕</button>
        </div>
        <div style="font-size:12px;color:var(--lv-lp-text-sub,#64748b);line-height:1.55;text-align:center;max-width:560px;">
            小飞驴全生态 8 大插件由独立开发者业余倾力打磨。您的每一份投喂，都将直接转化为源源不断的 Token 算力、模型测试与功能进化动力！
        </div>
        <div class="lv-sponsor-img-box" style="width:100%;display:flex;justify-content:center;border-radius:12px;overflow:hidden;border:1px solid var(--lv-lp-border,rgba(15,23,42,0.08));">
            <img class="lv-sponsor-img" src="${v(n)}" alt="小飞驴生态投喂 Token 赞助码" style="width:100%;max-width:620px;height:auto;display:block;border-radius:12px;" />
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;padding-top:2px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:11px;color:var(--lv-lp-text-sub,#94a3b8);">📱 打开微信 / 支付宝 [扫一扫] 直接投喂 · 点击空白处或 Esc 键关闭</span>
            <button type="button" class="lv-pop-sub-btn lv-sponsor-done-btn" style="padding:5px 16px;font-size:12px;font-weight:600;border-radius:8px;background:var(--lv-lp-panel-bg,#f1f5f9);color:var(--lv-lp-text,#0f172a);border:1px solid var(--lv-lp-border,rgba(15,23,42,0.12));cursor:pointer;">✕ 关闭</button>
        </div>
    `;let l=r.querySelector(".lv-sponsor-img"),c=r.querySelector(".lv-sponsor-img-box");l&&c&&l.addEventListener("error",()=>{c.innerHTML=`<div style="padding:20px;text-align:center;font-size:13px;line-height:1.7;color:var(--lv-lp-text,#0f172a);">感谢支持小飞驴生态！暂未加载赞助二维码，欢迎加入官方交流反馈群 <strong>${v(Je)}</strong> 或联系邮箱 <strong>${v(Pt)}</strong>。</div>`}),o.appendChild(r),C.body.appendChild(o);let i=null,a=!1,d=g=>{if(!(g.isComposing||g.keyCode===229)&&g.key==="Escape"){if(g.defaultPrevented)return;let h=Ge?.top?.();if(h&&h.id!=="lv-sponsor-modal")return;g.preventDefault?.(),g.stopPropagation?.(),g.stopImmediatePropagation?.(),p()}},p=()=>{try{i?.()}catch{}i=null;try{Ge?.pop?.("lv-sponsor-modal")}catch{}if(a){a=!1;try{C.removeEventListener("keydown",d,!0)}catch{}}try{o.remove()}catch{}};typeof Ge?.push=="function"?i=Ge.push({id:"lv-sponsor-modal",type:"dialog",dismiss:()=>(p(),!0)}):(a=!0,C.addEventListener("keydown",d,!0)),o.addEventListener("click",g=>{g.target===o&&p()}),r.querySelector(".lv-sponsor-close-btn")?.addEventListener("click",p),r.querySelector(".lv-sponsor-done-btn")?.addEventListener("click",p)}return{version:Oo,ensureDesktopStyles:po,computeStringSimilarity:En,computeInlineTokenDiff:Eo,computeBlockLevelLcsDiff:qn,lvDeduplicator:ke,buildInboxDrawerHtml:qo,buildLaunchpadPopoverHtml:Sn,openDesktopLaunchpadPopover:Ha,openDesktopLaunchpadPopoverImpl:Io,openMobileSheet:Co,openMobileSheetImpl:Mo,openPluginBazaarSettings:Do,openTaskManager:Zt,openNewTask:Jt,reloadUI:Cn,randomWalk:Ht,compressAndPutImageFile:Ho,openEcosystemRestoreDialog:Nn,lvConfirm:zt,lvPrompt:Bn,openConflictResolverDialog:kt,openClipPreviewModal:Pn,pasteToDailyNote:en,mountQuickModal:ft,openQuickNoteDialog:Xe,openLifeLogDialog:Nt,openQuickWorkspaceConfig:Rn,openSponsorModal:_n,openDiaryBottom:ot,writeTodayActivityReview:mn,buildDiagnosticReport:wa,findTodayDailyNoteDocIdByFileTree:ko,findTodayDailyNoteProbe:vt,findTodayDailyNoteDocId:qa,findOrCreateTodayDailyNoteDocId:Vt,ensureXiaolvDiaryZone:Ln,appendMarkdownToDailyNote:st,appendXiaolvLifeLogToDailyNote:Ia,queryXiaolvLifeLogs:Ca,exportBackupFull:Ma,restoreBackupFull:Aa}}var _o={protocol:200,init:Ro};try{if(typeof window<"u"){let H=window;H.__LV_KIT_CHUNKS__||(H.__LV_KIT_CHUNKS__={}),H.__LV_KIT_CHUNKS__["lv-kit-compass"]=_o}}catch{}var Ka=_o;return ja(Wa);})();
;(function(e){var d=e&&e.default?e.default:e;if(!d)return;var g=typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null);if(g){g.__LV_KIT_CHUNKS__=g.__LV_KIT_CHUNKS__||{};g.__LV_KIT_CHUNKS__["lv-kit-compass"]=d;}if(typeof module==="object"&&module&&typeof module.exports==="object"){module.exports=d;}})(typeof __LV_KIT_CHUNK_EXPORT__!=="undefined"?__LV_KIT_CHUNK_EXPORT__:undefined);
