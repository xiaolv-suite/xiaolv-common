// 桌面端独立系统置顶悬浮窗（Electron BrowserWindow · parent: undefined, alwaysOnTop: true）
// 思源最小化后依然稳浮于微信/QQ/浏览器等外部应用之上，点选即写入系统剪贴板并提示粘贴；
// 非 Electron 环境（Web/移动端）平滑降级，零报错且不留下孤儿进程。

export interface FloatEntryItem {
    id: string;
    title: string;
    summary: string;
    content?: string;
    category: string;
    tags: string[];
    itemType: string;
    shortcode?: string;
    varCount?: number;
}

export interface FloatClipItem {
    text: string;
    copiedAt: number;
}

export interface DesktopFloatOptions {
    entries: FloatEntryItem[];
    clips: FloatClipItem[];
    categories: string[];
    isDark: boolean;
    resolveAndCopyItem: (itemId: string) => Promise<{ok: boolean; text?: string}>;
    copyPlainText: (text: string) => Promise<boolean>;
    onClosed?: () => void;
}

export interface DesktopFloatHandle {
    update: (data: {entries: FloatEntryItem[]; clips: FloatClipItem[]; categories: string[]; isDark: boolean}) => void;
    focus: () => void;
    close: () => void;
    isOpen: () => boolean;
}

const activeFloatWindows = new Set<any>();
let currentHandle: DesktopFloatHandle | null = null;
let currentWin: any = null;

export function resolveElectronRemote(): {BrowserWindow?: any; clipboard?: {writeText: (t: string) => void}} | null {
    try {
        const req = (typeof window !== "undefined" && (window as any).require)
            || (typeof globalThis !== "undefined" && (globalThis as any).require);
        if (typeof req !== "function") return null;
        let remote: any = null;
        try {
            remote = req("@electron/remote");
        } catch {
            try {
                const electron = req("electron");
                remote = electron?.remote ?? null;
            } catch {
                remote = null;
            }
        }
        if (!remote || typeof remote.BrowserWindow !== "function") return null;
        let clipboard: {writeText: (t: string) => void} | undefined;
        try {
            const electron = req("electron");
            if (electron?.clipboard && typeof electron.clipboard.writeText === "function") {
                clipboard = electron.clipboard;
            }
        } catch {
            // ignore
        }
        return {
            BrowserWindow: remote.BrowserWindow,
            clipboard: clipboard ?? (remote.clipboard && typeof remote.clipboard.writeText === "function" ? remote.clipboard : undefined),
        };
    } catch {
        return null;
    }
}

export function isElectronFloatAvailable(): boolean {
    return Boolean(resolveElectronRemote()?.BrowserWindow);
}

export function closeAllDesktopFloatWindows(): void {
    currentHandle = null;
    currentWin = null;
    for (const win of Array.from(activeFloatWindows)) {
        activeFloatWindows.delete(win);
        try {
            if (typeof win?.isDestroyed === "function" && win.isDestroyed()) continue;
            if (typeof win?.close === "function") win.close();
            else if (typeof win?.destroy === "function") win.destroy();
        } catch {
            // ignore
        }
    }
}

function escapeJsonForScript(data: unknown): string {
    return JSON.stringify(data)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}

export function buildDesktopFloatHtml(initialData: {
    entries: FloatEntryItem[];
    clips: FloatClipItem[];
    categories: string[];
    isDark: boolean;
}): string {
    const payloadJson = escapeJsonForScript(initialData);
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>小驴常用 · 独立悬浮窗</title>
<style>
  :root {
    --bg: #ffffff;
    --surface: #f7f8fa;
    --surface-hover: #eef2ff;
    --ink: #1f2329;
    --muted: #646a73;
    --line: rgba(31, 35, 41, 0.1);
    --accent: #5b5bd6;
    --accent-soft: rgba(91, 91, 214, 0.12);
    --toast-bg: #1f2329;
    --toast-ink: #ffffff;
  }
  [data-theme="dark"] {
    --bg: #1e1f24;
    --surface: #27282e;
    --surface-hover: #323440;
    --ink: #e5e7eb;
    --muted: #9ca3af;
    --line: rgba(255, 255, 255, 0.1);
    --accent: #818cf8;
    --accent-soft: rgba(129, 140, 248, 0.16);
    --toast-bg: #374151;
    --toast-ink: #f9fafb;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--bg);
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 13px;
  }
  .wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid var(--line);
  }
  .topbar {
    height: 36px;
    padding: 0 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface);
    border-bottom: 1px solid var(--line);
    -webkit-app-region: drag;
    user-select: none;
    flex: 0 0 auto;
  }
  .title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--ink);
  }
  .top-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    -webkit-app-region: no-drag;
  }
  .icon-btn {
    border: none;
    background: transparent;
    color: var(--muted);
    width: 26px;
    height: 26px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .icon-btn:hover { background: var(--accent-soft); color: var(--accent); }
  .icon-btn.active { background: var(--accent-soft); color: var(--accent); }
  .search-wrap {
    padding: 6px 8px 4px;
    flex: 0 0 auto;
  }
  .search-input {
    width: 100%;
    height: 32px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    font-size: 12.5px;
    outline: none;
  }
  .search-input:focus { border-color: var(--accent); }
  .tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px 4px;
    flex: 0 0 auto;
  }
  .tab {
    flex: 1;
    height: 26px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: var(--surface);
    color: var(--muted);
    font-size: 11.5px;
    font-weight: 500;
    cursor: pointer;
  }
  .tab.active {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent);
    font-weight: 600;
  }
  .cats-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px 6px;
    flex: 0 0 auto;
  }
  .cats {
    display: flex;
    flex: 1;
    gap: 4px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .cats::-webkit-scrollbar { display: none; }
  .cats.expanded { flex-wrap: wrap; overflow-x: visible; }
  .cat-chip {
    flex: 0 0 auto;
    height: 22px;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--muted);
    font-size: 11px;
    cursor: pointer;
    white-space: nowrap;
  }
  .cat-chip.active {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent);
    font-weight: 600;
  }
  .arrow-btn {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--muted);
    cursor: pointer;
    font-size: 11px;
  }
  .list {
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 2px 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .sec-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    padding: 4px 4px 2px;
  }
  .sec-link {
    border: none;
    background: transparent;
    color: var(--accent);
    font-size: 11px;
    cursor: pointer;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: var(--surface);
    cursor: pointer;
    min-height: 36px;
  }
  .row:hover { background: var(--surface-hover); border-color: var(--accent); }
  .row-main { flex: 1; min-width: 0; }
  .row-title {
    font-size: 12.5px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .row-sub {
    font-size: 11px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 1px;
  }
  .copy-btn {
    flex: 0 0 auto;
    height: 24px;
    padding: 0 8px;
    border-radius: 6px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--ink);
    font-size: 11px;
    cursor: pointer;
  }
  .copy-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
  .empty { text-align: center; color: var(--muted); padding: 24px 8px; font-size: 12px; }
  .toast {
    position: fixed;
    left: 50%;
    bottom: 12px;
    transform: translateX(-50%);
    padding: 6px 12px;
    border-radius: 8px;
    background: var(--toast-bg);
    color: var(--toast-ink);
    font-size: 11.5px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
    white-space: nowrap;
    max-width: 92%;
    overflow: hidden;
    text-overflow: ellipsis;
    z-index: 99;
  }
  .toast.show { opacity: 0.96; }
</style>
</head>
<body>
<div class="wrap" id="app">
  <div class="topbar">
    <div class="title"><span>⠿</span><span>小驴常用 · 置顶浮窗</span></div>
    <div class="top-actions">
      <button type="button" class="icon-btn active" id="pinBtn" title="切换窗口总在最前">📌</button>
      <button type="button" class="icon-btn" id="closeBtn" title="关闭独立悬浮窗">×</button>
    </div>
  </div>
  <div class="search-wrap">
    <input type="text" class="search-input" id="searchInput" placeholder="搜索常用语或剪贴板，点击直接复制…" />
  </div>
  <div class="tabs">
    <button type="button" class="tab active" data-tab="home">首页</button>
    <button type="button" class="tab" data-tab="common">常用语</button>
    <button type="button" class="tab" data-tab="clipboard">剪贴板</button>
  </div>
  <div class="cats-wrap" id="catsWrap">
    <button type="button" class="arrow-btn" id="catPrev" title="向左滚动分类">‹</button>
    <div class="cats" id="catsList"></div>
    <button type="button" class="arrow-btn" id="catNext" title="向右滚动分类">›</button>
    <button type="button" class="arrow-btn" id="catExpand" title="展开全部分类">▾</button>
  </div>
  <div class="list" id="listEl"></div>
</div>
<div class="toast" id="toastEl"></div>
<script>
(function() {
  var state = ${payloadJson};
  var tab = "home";
  var activeCat = "";
  var query = "";
  var pinned = true;
  var catsExpanded = false;
  var seq = 0;
  var toastTimer = null;

  function emit(action) {
    action.seq = ++seq;
    location.hash = "#xlc=" + encodeURIComponent(JSON.stringify(action));
  }
  function showToast(msg) {
    var t = document.getElementById("toastEl");
    t.textContent = msg;
    t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { t.classList.remove("show"); }, 1800);
  }
  window.__xlcToast = showToast;
  window.__xlcUpdate = function(next) {
    if (!next) return;
    state.entries = next.entries || state.entries;
    state.clips = next.clips || state.clips;
    state.categories = next.categories || state.categories;
    if (typeof next.isDark === "boolean") {
      state.isDark = next.isDark;
      document.documentElement.setAttribute("data-theme", state.isDark ? "dark" : "light");
    }
    renderCats();
    renderList();
  };

  document.documentElement.setAttribute("data-theme", state.isDark ? "dark" : "light");

  document.getElementById("pinBtn").addEventListener("click", function() {
    pinned = !pinned;
    this.classList.toggle("active", pinned);
    emit({ type: "toggle-pin", pinned: pinned });
    showToast(pinned ? "已锁定总在最前" : "已取消总在最前");
  });
  document.getElementById("closeBtn").addEventListener("click", function() {
    emit({ type: "close" });
  });
  document.getElementById("searchInput").addEventListener("input", function() {
    query = (this.value || "").trim().toLowerCase();
    renderList();
  });
  document.querySelectorAll(".tab").forEach(function(btn) {
    btn.addEventListener("click", function() {
      tab = this.getAttribute("data-tab") || "home";
      document.querySelectorAll(".tab").forEach(function(b) {
        b.classList.toggle("active", b.getAttribute("data-tab") === tab);
      });
      renderCats();
      renderList();
    });
  });
  document.getElementById("catPrev").addEventListener("click", function() {
    document.getElementById("catsList").scrollLeft -= 120;
  });
  document.getElementById("catNext").addEventListener("click", function() {
    document.getElementById("catsList").scrollLeft += 120;
  });
  document.getElementById("catExpand").addEventListener("click", function() {
    catsExpanded = !catsExpanded;
    document.getElementById("catsList").classList.toggle("expanded", catsExpanded);
    this.textContent = catsExpanded ? "▴" : "▾";
  });
  document.getElementById("catsList").addEventListener("wheel", function(e) {
    if (!catsExpanded && Math.abs(e.deltaY) > 0) {
      e.preventDefault();
      this.scrollLeft += e.deltaY;
    }
  });

  function renderCats() {
    var wrap = document.getElementById("catsWrap");
    if (tab === "clipboard") {
      wrap.style.display = "none";
      return;
    }
    wrap.style.display = "flex";
    var list = document.getElementById("catsList");
    list.innerHTML = "";
    var cats = [""].concat(state.categories || []);
    cats.forEach(function(c) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-chip" + (activeCat === c ? " active" : "");
      btn.textContent = c || "全部";
      btn.addEventListener("click", function() {
        activeCat = (c && activeCat === c) ? "" : c;
        renderCats();
        renderList();
        document.getElementById("listEl").scrollTop = 0;
      });
      list.appendChild(btn);
    });
  }

  function makeRow(title, sub, onCopy) {
    var row = document.createElement("div");
    row.className = "row";
    var main = document.createElement("div");
    main.className = "row-main";
    var t = document.createElement("div");
    t.className = "row-title";
    t.textContent = title;
    main.appendChild(t);
    if (sub) {
      var s = document.createElement("div");
      s.className = "row-sub";
      s.textContent = sub;
      main.appendChild(s);
    }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "复制";
    row.addEventListener("click", onCopy);
    btn.addEventListener("click", function(e) { e.stopPropagation(); onCopy(); });
    row.append(main, btn);
    return row;
  }

  function renderList() {
    var el = document.getElementById("listEl");
    el.innerHTML = "";
    var clips = (state.clips || []).filter(function(c) {
      return !query || (c.text || "").toLowerCase().indexOf(query) !== -1;
    });
    var entries = (state.entries || []).filter(function(it) {
      if (activeCat && it.category !== activeCat && (it.category || "").indexOf(activeCat + "/") !== 0) return false;
      if (!query) return true;
      var hay = ((it.title || "") + " " + (it.summary || "") + " " + (it.shortcode || "") + " " + (it.category || "")).toLowerCase();
      return hay.indexOf(query) !== -1;
    });

    if (tab === "clipboard") {
      if (!clips.length) {
        el.innerHTML = '<div class="empty">暂无匹配剪贴板历史</div>';
        return;
      }
      clips.forEach(function(c) {
        var line = (c.text || "").replace(/[\\r\\n]+/g, " ").trim();
        el.appendChild(makeRow(line.slice(0, 48) || "(空)", "", function() {
          try { navigator.clipboard && navigator.clipboard.writeText(c.text); } catch(e) {}
          emit({ type: "copy-clip", text: c.text });
        }));
      });
      return;
    }

    if (tab === "home" && !query && !activeCat && clips.length > 0) {
      var cHead = document.createElement("div");
      cHead.className = "sec-head";
      var cTitle = document.createElement("span");
      cTitle.textContent = "⚡ 最近剪贴板";
      var cMore = document.createElement("button");
      cMore.type = "button";
      cMore.className = "sec-link";
      cMore.textContent = "全部 " + clips.length + " 条 →";
      cMore.addEventListener("click", function() {
        tab = "clipboard";
        document.querySelectorAll(".tab").forEach(function(b) {
          b.classList.toggle("active", b.getAttribute("data-tab") === "clipboard");
        });
        renderCats();
        renderList();
      });
      cHead.append(cTitle, cMore);
      el.appendChild(cHead);
      clips.slice(0, 3).forEach(function(c) {
        var line = (c.text || "").replace(/[\\r\\n]+/g, " ").trim();
        el.appendChild(makeRow("📋 " + (line.slice(0, 42) || "(空)"), "", function() {
          try { navigator.clipboard && navigator.clipboard.writeText(c.text); } catch(e) {}
          emit({ type: "copy-clip", text: c.text });
        }));
      });
    }

    var eHead = document.createElement("div");
    eHead.className = "sec-head";
    eHead.textContent = (activeCat ? activeCat : "常用语") + " · " + entries.length;
    el.appendChild(eHead);

    if (!entries.length) {
      var empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "暂无匹配常用语";
      el.appendChild(empty);
      return;
    }

    entries.forEach(function(it) {
      var sub = [it.shortcode, it.category, it.summary].filter(Boolean).join(" · ");
      el.appendChild(makeRow(it.title || it.summary || "未命名", sub, function() {
        var fallback = it.content || it.summary || it.title || "";
        try { navigator.clipboard && navigator.clipboard.writeText(fallback); } catch(e) {}
        emit({ type: "copy-entry", id: it.id });
      }));
    });
  }

  renderCats();
  renderList();
})();
</script>
</body>
</html>`;
}

export function openDesktopFloatWindow(options: DesktopFloatOptions): DesktopFloatHandle | null {
    const remote = resolveElectronRemote();
    if (!remote?.BrowserWindow) return null;

    if (currentWin && currentHandle && currentHandle.isOpen()) {
        currentHandle.update({
            entries: options.entries,
            clips: options.clips,
            categories: options.categories,
            isDark: options.isDark,
        });
        currentHandle.focus();
        return currentHandle;
    }

    const BrowserWindow = remote.BrowserWindow;
    const win = new BrowserWindow({
        width: 380,
        height: 560,
        minWidth: 300,
        minHeight: 360,
        parent: undefined,
        alwaysOnTop: true,
        frame: false,
        resizable: true,
        movable: true,
        minimizable: true,
        maximizable: false,
        autoHideMenuBar: true,
        title: "小驴常用",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    activeFloatWindows.add(win);
    currentWin = win;

    try {
        win.setAlwaysOnTop?.(true, "floating");
    } catch {
        try { win.setAlwaysOnTop?.(true); } catch {}
    }

    const notifyToast = (msg: string) => {
        try {
            if (win?.isDestroyed?.()) return;
            void win.webContents?.executeJavaScript?.(`window.__xlcToast && window.__xlcToast(${JSON.stringify(msg)})`);
        } catch {}
    };

    const writeSystemClipboard = async (text: string): Promise<boolean> => {
        try {
            remote.clipboard?.writeText(text);
        } catch {}
        try {
            return await options.copyPlainText(text);
        } catch {
            return true;
        }
    };

    const handleHashAction = async (url: string) => {
        const idx = typeof url === "string" ? url.indexOf("#xlc=") : -1;
        if (idx === -1) return;
        try {
            const raw = decodeURIComponent(url.slice(idx + 5));
            const action = JSON.parse(raw) as {type?: string; id?: string; text?: string; pinned?: boolean};
            if (action.type === "copy-entry" && action.id) {
                const res = await options.resolveAndCopyItem(action.id);
                if (res.text !== undefined) {
                    try { remote.clipboard?.writeText(res.text); } catch {}
                }
                if (res.ok) {
                    notifyToast("已复制，可直接 Ctrl+V 粘贴到微信等外部窗口");
                }
            } else if (action.type === "copy-clip" && typeof action.text === "string") {
                const ok = await writeSystemClipboard(action.text);
                if (ok) {
                    notifyToast("已复制，可直接 Ctrl+V 粘贴到微信等外部窗口");
                }
            } else if (action.type === "toggle-pin") {
                const pin = Boolean(action.pinned);
                try {
                    win.setAlwaysOnTop?.(pin, "floating");
                } catch {
                    try { win.setAlwaysOnTop?.(pin); } catch {}
                }
            } else if (action.type === "close") {
                try { win.close?.(); } catch {}
            }
        } catch {
            // ignore malformed hash action
        }
    };

    win.webContents?.on?.("did-navigate-in-page", (_ev: unknown, url: string) => {
        void handleHashAction(url);
    });

    win.on?.("closed", () => {
        activeFloatWindows.delete(win);
        if (currentWin === win) {
            currentWin = null;
            currentHandle = null;
        }
        options.onClosed?.();
    });

    const html = buildDesktopFloatHtml({
        entries: options.entries,
        clips: options.clips,
        categories: options.categories,
        isDark: options.isDark,
    });
    if (typeof win.loadURL === "function") {
        void win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    }

    const handle: DesktopFloatHandle = {
        update: (data) => {
            try {
                if (win?.isDestroyed?.()) return;
                void win.webContents?.executeJavaScript?.(`window.__xlcUpdate && window.__xlcUpdate(${escapeJsonForScript(data)})`);
            } catch {}
        },
        focus: () => {
            try {
                win.show?.();
                win.focus?.();
            } catch {}
        },
        close: () => {
            try {
                if (!win?.isDestroyed?.()) {
                    win.close?.();
                }
            } catch {}
        },
        isOpen: () => {
            try {
                return Boolean(win && !(typeof win.isDestroyed === "function" && win.isDestroyed()));
            } catch {
                return false;
            }
        },
    };
    currentHandle = handle;
    return handle;
}
