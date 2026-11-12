# Lv Common (Beta)

> **High-Frequency Content Asset Layer & Instant Cross-App Launcher for SiYuan Note**<br>
> Consolidate scattered code snippets, customer service replies, Prompt engineering libraries, tables, and text templates into parametric, source-traceable native SiYuan block assets.

[![CI](https://github.com/xiaolv-suite/xiaolv-common/actions/workflows/ci.yml/badge.svg)](https://github.com/xiaolv-suite/xiaolv-common/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/v/tag/xiaolv-suite/xiaolv-common?label=version&sort=semver)](https://github.com/xiaolv-suite/xiaolv-common/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 💡 Why Lv Common?

In our daily writing, coding, communicating, and administrative workflows, we repeatedly type the same information: billing details, customer replies, well-tuned AI prompts, boilerplate SQL, and code snippets.

Traditional solutions fall short:
- **Pain point 1: External clipboard managers detach from your knowledge base**
  Data in external tools forms isolated silos without bi-directional links back to notes and loses contextual relevance.
- **Pain point 2: Static templates cannot adapt to dynamic contexts**
  Copied templates often require manual edits (client name, date, amount, options), leading to frequent typos.
- **Pain point 3: High-value snippets across notes are hard to retrieve instantly**
  Valuable quotes and configs buried in your notes require tedious manual searching, disrupting your workflow.

**Lv Common's Solution**:
- **Anchored to real SiYuan blocks**: Every item is backed by a native SiYuan block with full metadata attributes and bi-directional links.
- **Dynamic variables & macro evaluation**: Embed input fields, date math, random options, currency conversion, and data masking directly into templates.
- **Sub-second Pinyin search & Omni-Search**: Instant recall via initial letter abbreviations, alias Tab direct insertion, and zero-SQL full-notebook search.
- **Cross-app global usability**: Open APIs, window bridges, and scripts for Quicker, Raycast, and AutoHotkey.

---

## 🎯 Five Primary Use Cases

| Scenario | Typical Content | Key Features |
| :--- | :--- | :--- |
| **👩‍💼 Customer Support & Operations** | Canned replies, refund policies, greeting templates | Interactive form cards `{{xlc:ask:name}}`, greeting macro `{{xlc:greeting}}`, privacy data masking `{{xlc:mask}}`, clean plain-text copy |
| **🤖 AI Prompt Engineering** | Structured CoT prompts, role descriptions, code review rules | Surround selection mode (`⌥⇧W` wraps selected text into prompts), snippet nesting `{{xlc:snippet:...}}`, preset configs |
| **💻 Development & Engineering** | Boilerplate SQL, Docker/K8s commands, regexes, configs | Code fence retention, JSON/Properties conversion, Base64/URL encoding, hash fingerprints, Tab/space indentation |
| **📑 Business, Billing & Invoicing** | Corporate tax IDs, bank accounts, quotation templates | Chinese currency uppercase conversion `{{xlc:currency}}`, multi-line numeric sum & average (`sumNumericLines`), TSV to Markdown table |
| **✍️ Writing & Knowledge Assets** | Academic citation templates, meeting notes, SOP checklists | Pangu spacing (`formatPanguSpacing`), task list batch toggling, line auto-numbering, executive summary extraction |

---

## 📦 Installation & Upgrade

1. **SiYuan Marketplace (Recommended)**: Open `Settings → Marketplace → Plugins` in SiYuan, search for **"Lv Common"** (`小驴常用`), and click Install & Enable.
2. **Manual Offline Install / Rollback**:
   - Extract `package.zip` (or rollback archive `package-v0.10.78.zip`) into `<workspace>/data/plugins/xiaolv-common/`;
   - Enable **Lv Common (Beta)** in `Settings → Plugins`.

---

## 🚀 3-Step Quick Start

### 1. Configure Library Document
Upon first launch, an onboarding dialog will appear:
- **Create Dedicated Library Doc (Recommended)**: Automatically creates a `Common Library` document in an existing notebook;
- **Create Dedicated Notebook**: Isolates your common assets in a separate notebook;
- **Bind Existing Document**: Uses any existing document as the storage target.

### 2. Capture Content Assets
- **Shortcut**: Press `⌥⇧N` (or `Alt+Shift+N`) to open the creation form;
- **Selection Capture**: Select text in the editor and click the Lv Common icon in the floating toolbar;
- **Clipboard Assetization**: Switch to `📋 Clipboard` view in the search dialog, select a snippet, and press `Alt+S`;
- **Omni-Search Capture**: Search all notes in the workspace and press `Alt+S` to capture any block.

### 3. Instant Recall & Invocation
- **Open Launcher**: Click the top toolbar icon or use the hotkey;
- **Pinyin Search**: Type initial letters (e.g., `cwbx` for `财务报销`);
- **Action Matrix**:
  - `Enter`: Insert directly at current editor cursor;
  - `Ctrl + Enter` (Mac: `⌘ + Enter`): Copy plain text / rich HTML to clipboard;
  - `Shift + Enter`: Insert as a live synced embed block;
  - `Alt + Enter`: Insert as a SiYuan block reference (`((id 'anchor'))`);
  - `Alt + 1 ~ 9`: Quick insert corresponding row item;
  - `Alt + Shift + 1 ~ 9`: Quick copy corresponding row item;
  - `Space`: Open Quick Look centered preview modal.

---

## 🛠️ Core Capabilities & Functions Overview

### 1. Native Block Asset Single Source of Truth
- **Native Block Storage**: All snippets, templates, and text assets are stored in native SiYuan blocks with `custom-xlc-*` attributes. Zero proprietary sidecar database lock-in; blocks remain searchable, editable, and linkable even without the plugin.
- **Rich Content Types**: First-class support for Plain Text, Markdown, Code (with auto syntax highlighting), Web URLs, Images, Assets, Block References, and Complex Composite Structures.
- **Multi-Dimensional Tagging**: Predefined semantic color badges (`Red`, `Orange`, `Green`, `Blue`, `Purple`) alongside infinite hierarchical `/` slash tags for flexible cataloging.
- **Zero-SQL Redline**: Strictly enforces standard kernel document tree APIs, eliminating `/api/query/sql` to prevent kernel lockups and database corruption.

### 2. Interactive Parameterized Form & Dynamic Macros
- **On-Demand Variable Forms**: Embed `{{xlc:ask:client_name}}`, `{{xlc:ask:plan|Basic,Pro,VIP}}`, or textareas. Entering hotkey prompts a focused popup with instant preview.
- **Preset Configuration Memory**: Save frequently used variable combinations (e.g., standard quotation vs. discounted quotation) for 1-click filling without retyping.
- **Rich Dynamic Macro Engine**:
  - **Date & Time**: `{{xlc:date}}`, `{{xlc:date|+3d}}`, `{{xlc:date|tomorrow}}`, `{{xlc:timeago|timestamp}}`, `{{xlc:lunar:year}}`;
  - **Math & Security**: `{{xlc:calc|100*1.13}}` (recursive-descent parser), `{{xlc:password|16}}`, `{{xlc:uuid}}`, `{{xlc:nanoid}}`, `{{xlc:fingerprint}}`, `{{xlc:checksum}}`;
  - **Text & Transformation**: `{{xlc:currency}}` (Chinese uppercase), `{{xlc:thousands}}`, `{{xlc:radix}}`, `{{xlc:case:camel}}`, `{{xlc:obfuscate}}`, `{{xlc:plural}}`, `{{xlc:initials}}`, `{{xlc:truncate}}`, `{{xlc:btruncate}}`, `{{xlc:mask}}`, `{{xlc:smask}}`, `{{xlc:censor}}`, `{{xlc:pad}}`, `{{xlc:seq}}`, `{{xlc:repeat}}`, `{{xlc:center}}`, `{{xlc:slash}}`, `{{xlc:revwords}}`, `{{xlc:randomname}}`, `{{xlc:if}}`, `{{xlc:shuffle}}`;
  - **Structure & Context**: `{{xlc:snippet:title}}` nested expansion, `{{xlc:selection}}` selection surround placeholder, `{{xlc:template}}` key-value interpolation.

### 3. Sub-Second Pinyin Retrieval & Omni-Search Penetration
- **Full Pinyin & Initial Abbreviation Indexing**: Search `cwbx` to immediately match `财务报销`, with real-time matched character highlights.
- **Workspace-Wide Omni-Search**: Search all blocks across the entire workspace notebook library via `@` or `/` prefix; assetize high-value snippets into Common Library with `Alt+S`.
- **Frecency Intelligent Ranking**: Merges access frequency with time decay (recent 24h, 7d, 30d, 90d weights) to ensure most relevant items float to the top.
- **Recall Alias Direct Insertion**: Assign short aliases (e.g. `addr`) to items; type in editor and press `Tab` to insert instantly without opening search modal.

### 4. Universal Clipboard & Text Cleansing Engine
- **80+ Pure Utility Functions**: Clean and transform text in 1 click from search dialog action menu or creation form toolbar.
- **CJK Typography Formatting**: Pangu Chinese-English spacing, punctuation correction, NBSP and trailing whitespace stripping, CJK visual width measurement.
- **Markdown Document Processing**: Heading-list bidirectional conversion, table column alignment & key-value/CSV conversion, footnote re-indexing, code fence language tagging, blockquote flattening, inline formatting stripping, task list status inversion & progress tracking.
- **List & Data Processing**: Numeric range filtering, list shuffling, list indentation shifting, alphabetical grouping, delimiter sniffing & conversion, deduplication with count.

### 5. Multi-Mode Output Matrix & Quick Look
- **5-Way Insertion Matrix**:
  - `Enter`: Insert plain/Markdown text directly into editor cursor;
  - `Ctrl + Enter` (Mac: `⌘ + Enter`): Copy plain text or rich HTML to system clipboard;
  - `Shift + Enter`: Insert as a live synchronized embed block (`{{id}}`);
  - `Alt + Enter`: Insert as a standard bi-directional block reference (`((id 'anchor'))`);
  - `⌥ + ⇧ + W`: Wrap current selected editor text with snippet template (Surround Mode).
- **Sequential Paste Queue (Stacking)**: Multi-select items to form a queue, then sequentially paste items one by one with `⌥⇧Q`.
- **Quick Look Immersive Modal**: Press `Space` in launcher to open centered large-card preview with syntax highlighting.

### 6. Cross-Application Ecosystem & Protocol Bridges
- **Global External Launcher Direct Access**: Support external tools (Quicker, Raycast, Alfred, AutoHotkey) invoking `window.xiaolvCommon.insertCommonItem()` or protocol commands.
- **Lv Plugin Family Interoperability**: Seamlessly bridges with Lv SpeedSwitch, Lv Checkin, Lv Contacts, Lv Glean, and Lv Exam via the standardized `xiaolv-common/v1` protocol.

---

## ⚙️ Settings Reference

| Section | Setting | Default | Description |
| :--- | :--- | :--- | :--- |
| **📦 Library** | Library Mode & Target | Unconfigured | Choose Dedicated Doc (recommended), Independent Notebook, or Document Tree |
| **⚙️ Preferences** | Prompt for Variables (`promptVariables`) | `true` | Prompt a fill-in card when an item contains `{{xlc:ask:...}}` / `{{input:...}}` |
| **⚙️ Preferences** | Record Usage (`recordUsage`) | `true` | Track usage count & recency locally for Frecency ranking and ROI insights |
| **⚙️ Preferences** | Clear Variable Memory | On-demand | Clear locally remembered variable prefill history without touching templates |
| **🤖 AI Assistant** | Enable AI / Share Content | `false` | Reuse SiYuan's configured AI model (zero plugin API keys) for tidy, draft, and `?` search |
| **🔍 Search** | Pinyin Search / Dynamic Placeholders | `true` | Enable Chinese Pinyin matching and `{{xlc:...}}` macro evaluation on insert/copy |
| **🏥 Health Doctor** | Run Health Check | On-demand | Diagnose snippet cycles, missing child snippets, broken placeholders, and dead links |
| **💾 Data & Sync** | Export / Import / Sync Diff | On-demand | JSON backup, Markdown pack (with privacy sanitizer), CSV/TSV wizard, Espanso import, and Diff merge |

---

## ❓ Frequently Asked Questions (FAQ)

- **Q1: Where is my data stored? Will uninstalling the plugin lose my snippets?**
  All items are stored as real SiYuan blocks inside your chosen library document/notebook with `custom-xlc-*` block attributes. Even if you uninstall the plugin, your notes and blocks remain intact.
- **Q2: Can I save multi-paragraph bodies, lists, and tables?**
  Yes. Since v0.10.80 a multi-paragraph body is stored inside **one superblock** in the library document, so creating, editing, importing, and the example packs are no longer limited to a single line; all 25 built-in examples install. The only rule: a body line may not start with `{{{` / `}}}` (superblock boundary markers); put them in a code fence if needed. Legacy multi-part items from early versions stay readable with read-only bodies.
- **Q3: How do `:shortcode` triggers work?**
  Assign a shortcode like `:wk` or `:bug` when creating/editing an item (or import from Espanso). Typing `:wk` in search boosts it to the top (+500) and lets you press `Tab` or `Enter` to insert immediately.

---

## 🔒 Security Baseline & Known Boundaries

- **Item container (superblock)**: Each item is one top-level block in the library document; multi-paragraph bodies live inside one superblock and item metadata stays on that block's `custom-xlc-*` attributes. Write, read-back, update, delete, per-item read-back of all 5 example packs, and the [24-step real-host release checklist](scripts/e2e-real-checklist.cjs) (25/25 assertions green) have been verified against an isolated SiYuan 3.8.9 kernel + real SiYuan desktop frontend.
- **Zero-SQL Redline**: Strictly zero calls to `/api/query/sql`; all operations rely on official structured APIs.
- **Mobile Environment**: Touch and image clipboard operations on Android operate under graceful fallbacks.

---

## 🆕 Latest Release Highlights

- **SiYuan 3.8.10+ Native Adaptations**: OmniSearch result rows, preview location chips, and preview headers support native document tree context menus (`showDocTreeNativeMenu`) via zero-SQL `getBlockInfo`; `safeDocTitleFromHPath` prevents title truncation on slashes; added plain-text stripping shortcuts (`Alt+Shift+R` / `Alt+Shift+C`).
- **Input Method & Clipboard Resilience**: Snippet Dock search box yields to IME composition so candidate selection isn't intercepted; Settings code exports (Quicker/AHK/cURL/Raycast) and orphan notebook ID copy buttons now surface explicit error notices on clipboard failure (clipboard coverage contract enforced).
- **Mobile & Touch Polish**: Capture form action bar clears iOS bottom safe area; tag chips enforce 32px touch floor; sync strategy select uses 16px anti-zoom baseline.
- **Performance & Engineering Gates**: Discovery filtering and Sync Diff view rebuilds debounced; desktop hover affordances added for close buttons, chips, and breadcrumbs; i18n parity and passive scroll listeners formalized as contracts.

<details>
<summary><b>📜 Historical Release Highlights (v0.10.84 and earlier)</b></summary>

### [v0.10.84] — 2026-11-10
- Launchpad microtask convergence debounce, SiYuan topbar self-healing, desktop hover drawer locking, mobile pull-down keyboard defense, and `xiaolv-suite` organization migration.

### [v0.10.83] — 2026-11-04

v0.10.83 Local Release: Epoch 7 Lv Ecosystem Federation Core Kit integration (in-place inline micro-animations, ephemeral capsules, unified heartbeat ticker, kernel document write mutex, top-surface & Esc stack, AI gateway, full backup orchestrator, dynamic Launchpad badges, and Omnisearch engine), concurrent generational promise index cache & write-lock memory leak elimination, multi-level Esc arbitration fix, AI template expansion graceful degradation, and kernel retry resilience hardening:
- **Epoch 7 Lv Ecosystem Federation Core Kit Integration**:
  - **Progressive Micro-Feedback & Quiet Notifications (lvNotify)**: In-place micro-animations (`lvNotify.inline`) and ephemeral capsules (`lvNotify.capsule`) for copy success and favorite toggles, eliminating disruptive toast popups and preserving user flow;
  - **Unified Heartbeat Clock (lvTicker)**: Eliminates fragmented timers, aligned to 10s/1m beats with automatic power-saving sleep mode (60s interval) when blurred/minimized, reducing wake-up CPU draw by 75%;
  - **Kernel Document Write Barrier & Mutex (withDocLock)**: Per-docId in-memory Promise queueing, completely eliminating underlying SiYuan `document is locked` concurrency errors;
  - **Top-Surface & Keyboard Focus Stack (lvSurfaceStack)**: Capture-phase `Escape` key arbitration with `"keep"` retention semantics; sub-mode exits (multi-select, QuickLook, menus) never accidentally dismiss parent dialogs;
  - **Unified AI Concurrency Shaping & Gateway (lvAi)**: Shared API Key and model configurations across all Lv plugins with queue shaping and exponential backoff on HTTP 429 rate limits;
  - **Unified Daily Activity Stream (lvActivity)**: Broadcasts template applications and code snippet insertions into an immutable daily timeline, exportable as structured Markdown for daily notes;
  - **Ecosystem Full Backup Orchestrator (lvBackup)**: Unified cross-plugin backup and restore cut-points for seamless migration and disaster recovery;
  - **Dynamic Launchpad Badges (lvLaunchpad)**: Plugin launcher badge dynamically reflects actual active library item count rather than static hardcoding;
  - **Unified Global Omnisearch (lvOmnisearch)**: Provides cross-plugin full-text retrieval for snippets, expanded to match aliases and `:shortcodes`.
- **Bug Fixes & Engineering Hardening (T-0821 ~ T-0826)**:
  - **Core Library Service · Generational Promise Cache (T-0821)**: Fixed stale promise race condition in `ensureIndex`, binding running promises to `buildingGen` to prevent invalidation from returning outdated scans;
  - **Infrastructure · withDocLock Memory Leak Fix (T-0822)**: Fixed promise chain comparison in `finally`, ensuring released lock keys are deleted from memory immediately;
  - **UI Interaction · Esc Arbitration & Surface Stack Fix (T-0823)**:
    - Notice hub card handle registers dynamically only when active cards exist, preventing inactive handles from blocking downstream Escape handling;
    - Search dialog sub-mode exits return `"keep"`, preserving the dialog in the focus stack;
    - Discovery dialog (main, close confirmation, save view) and Dock context menus are fully registered in `lvSurfaceStack`;
  - **AI Service · Template Expansion Graceful Degradation (T-0824)**: Wrapped `aiSmartExpandTemplate` in try/catch to log warnings and safely return original text when offline or unconfigured;
  - **Ecosystem Linkage · Dynamic Launchpad Badge & Omnisearch Expansion (T-0825)**: Eliminated hardcoded badge text and extended Omnisearch to match aliases and shortcodes;
  - **Host Resilience · Write Retry & E2E Timing Hardening (T-0826)**: Removed premature `maxRetries: 0` from `pushToSourceBlock`, added dynamic polling and `waitForFunction` in real-host E2E regression tests.

### [v0.10.82] — 2026-11-01

v0.10.82 Local Release: Starter Packs Hub with ready-to-use industry suites & dedicated outline notebook doc creation, ultra-compact single-column Floating Mini Mode (`Alt+M` with 1~9 direct keys & collapse pill), deep Lv ecosystem interoperability (Raikiri snippet content contract alignment, dynamic ecosystem macro matrix, federated search, push to Lv Home memo, and Epoch 6 standardized event bus envelope), and 24-step (25 assertions) automated real-host E2E regression:
- **Starter Packs Hub & Domain Presets (T-0808~T-0816 / Batch F12~F14)**:
  - Persistent bottom footer entry (`footer.starter-packs`) with 4 industry suites: Business & Finance Invoicing, E-commerce Support & After-sales, Dev & Technical Operations, Writing Formatting & Academic Citations, plus Callout formatting and SuperMemo gradual reflection packs;
  - **Expandable Drawer Previews**: Each suite features an eye button (`starter-hub.preview.*`) to inspect items, categories, and tags without installing;
  - **1-Click Direct Enablement**: In-place import with automatic duplicate skipping based on stable logical IDs;
  - **Dedicated SiYuan Outline Documents**: 1-click generation of structured outline documents (`常用资产 · 场景套件`) in the current notebook, anchoring native blocks directly.
- **Floating Mini Mode (Batch F11)**:
  - Toggle anytime via `Alt+M` or the `📐` button on the search bar;
  - **1~9 Direct Trigger**: Micro numeric badges on the first 9 rows (`1`~`9` to insert, `Shift+1`~`9` to copy);
  - **Top Drag Handle & Memory**: Drag anywhere with coordinate persistence;
  - **1-Click Collapse to Floating Pill**: Minimizes to `search.mini.collapsed-pill` at the desktop margin, expanding on click.
- **Deep Ecosystem Interoperability (T-0817~T-0820 / Batch F15)**:
  - **External Bridge (window.xiaolvCommon) Contract Alignment**: Added populated `content` fields to search, recent, and get endpoints, ensuring Lv Raikiri (`siyuan-speed-switch`) and quickgate copy clean snippet text on Enter;
  - **Dynamic Ecosystem Macro Matrix**: Asynchronous resolution of `{{xlc:home:today}}` / `{{xlc:butler:today}}` (Lv Home reminders), `{{xlc:task:today}}` (Task Horizon), `{{xlc:glean:recent}}` (Lv Glean clips), `{{xlc:contacts:recent}}` (Lv Contacts cards), and `{{xlc:checkin:today}}` (Lv Checkin) with timeout circuit breaking and graceful fallback text when uninstalled;
  - **Federated Ecosystem Search**: Concurrent multi-plugin queries for reminders, clips, and habits with direct Enter insertion;
  - **1-Click Push to Lv Home Memo**: Added `📋` promote action on clipboard history cards to create reminders directly in Lv Home;
  - **Epoch 6 Event Bus Envelope**: Standardized all lifecycle events to `v: 1, source: "xiaolv-common", eventId, at, payload, idempotencyKey` with legacy flat properties retained for 100% backward compatibility.
- **Automated 24-Step (25 Assertions) Real-Host E2E Testing**:
  - Full `pnpm e2e:isolated` test pipeline passing 100% across isolated kernel acceptance (12/12), discovery (11/11), and real desktop browser checklist (25/25) with negative verification proof.

### [v0.10.81] — 2026-11-01

v0.10.81 Local Release: Default-on clipboard history with capacity tiers, 1-click clipboard-to-asset promotion with automatic annotation stripping & pinyin alias inference, native Protyle inline slash command expansion, purple highlight ring removal, interactive 4-step onboarding guide, and normalized settings page typography:
- **Clipboard History Default ON & Capacity Setting (T-0775)**: `clipboardHistoryEnabled` defaults to `true` with zero cloud egress; default capacity of 30 items with 30/50/80/100 presets and strict 100-item cap; includes one-click clear button.
- **One-Click Promotion from Clipboard to Asset (T-0776)**: Quick `⭐` button on clipboard rows and preview footer; automatically strips trailing `@annotations` (`18588888888@mobile`), `[tax-id]` tags, and `// comments`, storing pure clean payload, title, tags, category `常用`, and auto-derived pinyin alias (`sjh`).
- **Protyle Inline Slash Direct Trigger (T-0777)**: Native Protyle `/剪贴板历史` (`/jtb`, `/clip`) slash entry; dynamically registers high-frequency library snippets with shortcodes (`:phone`) and aliases (`sjh`) as `⚡ title [shortcode]`, enabling instant in-place insertion right at the cursor without dialog popups.
- **Complete Elimination of Purple Focus Borders (T-0773)**: Removed `--b3-theme-primary` purple override, dynamically bound all focus rings and active rows to SiYuan native primary theme color (`var(--b3-theme-primary)` / `#3575f0`).
- **Dedicated Real-World Samples & Step Guide (T-0773)**: 17 production-grade snippets generated on first run with interactive 4-step guide dialog (`guide-dialog.ts`) showing live before/after annotation stripping.
- **Settings Typography & Template Cards Modernization (T-0774)**: Normalized row typography to 14px body and 12.5px hints; redesigned template packs into bounded, comfortable cards.
- **Full Verification Suite**: 1182/1182 unit tests, 79/79 interaction audits, 12/12 viewport visibility tests, and 21/21 isolated real-kernel checklist tests all passing.

| Milestone | Highlights | ADR |
| :--- | :--- | :--- |
| **v0.10.80** | Multi-paragraph superblock storage container (all 25/25 built-in examples installable), UI surface reduction with searchable "Text Tools" drawers, and multi-zoom viewport gates | [ADR 0165](./docs/adr/0165-superblock-item-container-and-surface-convergence.md) |
| **v0.10.79** | Single source-of-truth material convergence, `:shortcode` end-to-end closure, Sync Diff & adjacent block probe fixes, and dynamic macro evaluation consistency | [ADR 0164](./docs/adr/0164-full-chain-closure-and-material-convergence.md) |
| **v0.10.78** | Full-spectrum usability closure, 6 modern visual design systems, and user manual overhaul | [ADR 0163](./docs/adr/0163-github-benchmark-fusion-shortcode-macro-frecency.md) |
| **v0.10.77** | Export sanitizer options dialog hierarchy cleanup and design token convergence | [ADR 0159](./docs/adr/0159-export-sanitizer-modal-closure.md) |
| **v0.10.76** | Sync diff visualization modal host mount closure, and settings data management integration | [ADR 0158](./docs/adr/0158-sync-diff-ui-closure.md) |
| **v0.10.75** | CSV/TSV interactive wizard column mapping closure, dynamic option generation, and automatic initial inference | [ADR 0157](./docs/adr/0157-csv-tsv-wizard-closure.md) |
| **v0.10.74** | UI backlog full closure, search history horizontal scrolling, optical indicator alignment, and breathable multi-select pill styling | [ADR 0156](./docs/adr/0156-ui-backlog-refinements-and-optical-alignments.md) |
| **v0.10.73** | Comprehensive entry usability audit, P0 selection caret blockId extraction fix, command palette mode dispatching, and single-item paste queue action | [ADR 0155](./docs/adr/0155-entry-usability-and-closure-hardening.md) |
| **v0.10.71** | Dock keyboard roving navigation & quick action, CSV to list macro, and URL Query building engine | [ADR 0153](./docs/adr/0153-dock-keyboard-and-formatting-pipeline.md) |
| **v0.10.70** | Dock category tree state memory, URL component extraction engine, and multi-line prefix/suffix formatting macros | [ADR 0152](./docs/adr/0152-dock-memory-and-formatting-macros.md) |
| **v0.10.69** | Visual and perceptual layer modernization, unified three-tier design tokens convergence, and accessibility hardening | [ADR 0151](./docs/adr/0151-visual-token-convergence-and-a11y-hierarchy.md) |
| **v0.10.68** | Dock category tree folding, advanced drag-and-drop modalities, context menu, and end-to-end UX hardening | [ADR 0150](./docs/adr/0150-dock-tree-folding-and-drag-modes.md) |
| **v0.10.66** | Quality hardening, context-aware context menu, enter-to-create empty state self-healing, and interaction reliability | [ADR 0148](./docs/adr/0148-quality-hardening-callout-preview-and-prototype-defense.md) |
| **v0.10.65** | Table beautification (`beautifyMarkdownTable`), JSON path query macro (`queryJsonPath` / `{{xlc:json}}`), and Callout formatting | [ADR 0147](./docs/adr/0147-table-beautify-json-macro-and-callouts.md) |
| **v0.10.64** | Comprehensive quality optimization, zero lifecycle leaks, syntax highlighting fix, and interaction reliability | [ADR 0146](./docs/adr/0146-comprehensive-quality-optimization-and-reliability.md) |
| **v0.10.63** | Markdown heading numbering/stripping (`numberMarkdownHeadings`), task progress bar macro (`{{xlc:progress}}`), and table matrix transposition | [ADR 0145](./docs/adr/0145-heading-numbers-progressbar-and-transpose-table.md) |
| **v0.10.62** | Markdown headings to list conversion (`convertHeadingsToList`), list shuffle macro (`shuffleList` / `{{xlc:shuffle}}`), and numeric range line filtering | [ADR 0144](./docs/adr/0144-headings-to-list-shuffle-macro-and-numeric-filter.md) |
| **v0.10.61** | Number symbol conversion (`convertNumberSymbols`), sensitive keyword censoring (`censorText` / `{{xlc:censor}}`), and Markdown pure code block extraction | [ADR 0143](./docs/adr/0143-number-symbols-censor-macro-and-extract-code.md) |
| **v0.10.60** | Markdown nested list flattening (`flattenNestedList`), string range masking (`maskTextRange` / `{{xlc:smask}}`), and comprehensive CJK spacing | [ADR 0142](./docs/adr/0142-flatten-list-smask-macro-and-cjk-spacing.md) |
| **v0.10.59** | Visual width metrics (`measureVisualWidth`), ternary conditional evaluation (`{{xlc:if}}`), and list indentation shifting | [ADR 0141](./docs/adr/0141-visual-width-if-macro-and-shift-indent.md) |
| **v0.10.58** | Markdown KPI summary card generation (`formatKpiSummaryCard`), realistic random name generator (`{{xlc:randomname}}`), and alphabetical list grouping | [ADR 0140](./docs/adr/0140-kpi-card-random-name-and-alphabet-group.md) |
| **v0.10.57** | Markdown blockquote flattening & stripping (`flattenMarkdownBlockquotes`), word-level reversal (`{{xlc:revwords}}`), and inline Markdown formatting stripping | [ADR 0139](./docs/adr/0139-flatten-quotes-revwords-and-strip-inline.md) |
| **v0.10.56** | Markdown footnote re-indexing & bottom grouping (`normalizeMarkdownFootnotes`), backslash escaping (`{{xlc:slash}}`), and delimiter line chunking | [ADR 0138](./docs/adr/0138-footnotes-slash-macro-and-line-chunks.md) |
| **v0.10.55** | Markdown task status inversion (`invertTaskStatus`), visual width centering (`{{xlc:center}}`), and list delimiter smart conversion | [ADR 0137](./docs/adr/0137-invert-task-center-macro-and-delim-convert.md) |
| **v0.10.54** | Markdown list pinyin/alphabetical sorting (`sortMarkdownList`), character sequence repetition (`{{xlc:repeat}}`), and visual width line sorting | [ADR 0136](./docs/adr/0136-sort-list-repeat-macro-and-sort-by-width.md) |
| **v0.10.53** | Code fence language tagging (`setMarkdownCodeFenceLang`), macro pipe delimiter escaping (`{{xlc:escape}}`), and multi-column grid formatting | [ADR 0135](./docs/adr/0135-code-fence-lang-escape-macro-and-grid-columns.md) |
| **v0.10.52** | Key-value to Markdown table (`keyValueToMarkdownTable`), English plural/singular toggle (`{{xlc:plural}}`), and outline TOC generation | [ADR 0134](./docs/adr/0134-kv-to-table-plural-macro-and-markdown-toc.md) |
| **v0.10.51** | Markdown table to YAML/key-value (`markdownTableToKeyValue`), Chinese pinyin initials (`{{xlc:initials}}`), and strict blank line normalization | [ADR 0133](./docs/adr/0133-table-to-kv-initials-macro-and-blank-lines.md) |
| **v0.10.50** | Markdown links conversion & extraction (`convertMarkdownLinks`), UTF-8 byte boundary truncation (`{{xlc:btruncate}}`), and punctuation spacing formatting | [ADR 0132](./docs/adr/0132-markdown-links-btruncate-and-punctuation-spacing.md) |
| **v0.10.40 ~ v0.10.49** | Punctuation correction, text obfuscation, code comments toggle, unit spacing, brackets balance, set operations, radix conversion, and 30+ pure utility functions | [CHANGELOG.md](./CHANGELOG.md) |
| **v0.10.0 ~ v0.10.39** | Pure text cleaning toolbox, parameterized form builder, variable preset memory, Omni-Search, and Quicker/Raycast external launcher integration | [CHANGELOG.md](./CHANGELOG.md) |
| **v0.1.0 ~ v0.9.x** | Native block single-source-of-truth architecture, pinyin search, bi-directional link tracking, export redaction, and core launcher | [CHANGELOG.md](./CHANGELOG.md) |

> 📌 For the full evolution history across 520+ tasks and commits, please refer to the complete [CHANGELOG.md](./CHANGELOG.md).
</details>

---

## ⌨️ Shortcut Reference

| Windows/Linux | macOS | Context | Description |
| :--- | :--- | :--- | :--- |
| `Alt + Shift + N` | `⌥ + ⇧ + N` | Global | Open new item creation form |
| `Alt + Shift + V` | `⌥ + ⇧ + V` | Global | Fast capture clipboard content into library |
| `Alt + Shift + W` | `⌥ + ⇧ + W` | Editor | Surround current selected text with template |
| `Alt + Shift + Q` | `⌥ + ⇧ + Q` | Global | Paste next item from continuous paste queue |
| `Enter` | `Enter` | Launcher | Insert selected item at editor cursor |
| `Ctrl + Enter` | `⌘ + Enter` | Launcher | Copy selected item as text/rich-text to clipboard |
| `Shift + Enter` | `Shift + Enter` | Launcher | Insert selected item as live synced embed block |
| `Alt + Enter` | `⌥ + Enter` | Launcher | Insert selected item as standard block reference |
| `Alt + 1 ~ 9` | `⌥ + 1 ~ 9` | Launcher | Lightning insert: insert corresponding numbered item |
| `Alt + Shift + 1 ~ 9` | `⌥ + ⇧ + 1 ~ 9` | Launcher | Lightning copy: copy corresponding numbered item |
| `Space` | `Space` | Launcher | Open/close centered Quick Look preview modal |
| `Tab` | `Tab` | Launcher | Quick recall alias match or toggle focus to preview |
| `Alt + S` | `⌥ + S` | Launcher | Capture clipboard snippet or note block into library |
| `Alt + M` | `⌥ + M` | Launcher | Toggle ultra-compact Floating Mini Mode / standard mode |
| `Alt + T` | `⌥ + T` | Launcher | Cycle search scopes (All / Common / Recent / Star / Clip / Omni) |
| `Alt + P` | `⌥ + P` | Launcher | Toggle pin window mode for continuous usage |
| `Alt + Shift + D` | `⌥ + ⇧ + D` | Global | Toggle open/close snippet Dock panel |

---

## 🐴 Lv Plugin Ecosystem

| Plugin | Core Purpose | Repository |
| :--- | :--- | :--- |
| **Lv Common** | Content asset layer, template parameterization & instant launcher | [xiaolv-suite/xiaolv-common](https://github.com/xiaolv-suite/xiaolv-common) |
| **Lv SpeedSwitch** | Workspace navigator and switcher connecting tabs and snippets | [xiaolv-suite/siyuan-speed-switch](https://github.com/xiaolv-suite/siyuan-speed-switch) |
| **Lv Checkin** | Local-first habit and goal check-in workbench | [xiaolv-suite/siyuan-checkin](https://github.com/xiaolv-suite/siyuan-checkin) |
| **Lv Contacts** | Relationship network, contact profiles, and interaction logs | [xiaolv-suite/siyuan-contacts](https://github.com/xiaolv-suite/siyuan-contacts) |
| **Lv Glean** | Clipping and deep reading review management | [xiaolv-suite/siyuan-glean](https://github.com/xiaolv-suite/siyuan-glean) |
| **Lv Exam** | Local exam preparation, test banks, and wrong answer review | [xiaolv-suite/siyuan-exam](https://github.com/xiaolv-suite/siyuan-exam) |
| **Lv Home** | Family records, living asset ledger, and reminder center | [xiaolv-suite/siyuan-home](https://github.com/xiaolv-suite/siyuan-home) |

---

## 💬 Community & Feedback

- **Beta Tester QQ Group**: **871707735**
- **Issue Tracker**: [GitHub Issues](https://github.com/xiaolv-suite/xiaolv-common/issues)
- **License**: [MIT License](./LICENSE)
