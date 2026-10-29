# Lv Common (Beta)

> **High-Frequency Content Asset Layer & Instant Cross-App Launcher for SiYuan Note**<br>
> Consolidate scattered code snippets, customer service replies, Prompt engineering libraries, tables, and text templates into parametric, source-traceable native SiYuan block assets.

[![CI](https://github.com/ai68298100/xiaolv-common/actions/workflows/ci.yml/badge.svg)](https://github.com/ai68298100/xiaolv-common/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/v/tag/ai68298100/xiaolv-common?label=version&sort=semver)](https://github.com/ai68298100/xiaolv-common/releases)
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

## 🔒 Security Baseline & Known Boundaries

- **B-006 Kramdown Pre-write Safeguards**: To prevent parser runaway, single-line text or a complete code fence is accepted for writes. Multi-line snippets should use code blocks or block references.
- **Zero-SQL Redline**: Strictly zero calls to `/api/query/sql`; all operations rely on official structured APIs.
- **Mobile Environment**: Touch and image clipboard operations on Android operate under graceful fallbacks.

---

## 🆕 Latest Release Highlights

### [v0.10.65] — 2026-10-29 (Latest)

Markdown table beautification, JSON path query macro, and Markdown callout block transformation:
- **Markdown Table Column Beautification (`beautifyMarkdownTable`)**: Pure function automatically calculating maximum visual column widths across CJK double-width and ASCII characters, padding cells with spaces so column vertical borders are perfectly aligned in raw markdown; wired to action menu and variable form.
- **JSON Path Query Engine (`queryJsonPath`) & `{{xlc:json}}` Macro**: Pure function extracting nested properties via dot/bracket paths (e.g., `user.roles[0].name`), listing top-level keys (`keys`), or pretty-formatting JSON; expanded dynamic macros `{{xlc:json|user.name|{"user":{"name":"Alice"}}}}`, `{{xlc:json:keys|...}}`, and `{{xlc:json:pretty|...}}`; wired to action menu and variable form.
- **Markdown Callout Formatting (`formatMarkdownCallout`)**: Pure function wrapping text or existing blockquotes into standard GitHub/Obsidian callouts (`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, etc.), supporting collapsible headers (`> [!NOTE]- Title`) and clean stripping; wired to action menu and variable form.
- **Quality Gates**: Unit test suite reached the milestone of **1000/1000 passing tests** with verified negative tests.

<details>
<summary><b>📜 Click to expand historical evolution records (v0.1.0 ~ v0.10.64, collapsed)</b></summary>

| Milestone | Key Release Highlights Summary | Architecture Decision |
| :--- | :--- | :--- |
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
| `Alt + T` | `⌥ + T` | Launcher | Cycle search scopes (All / Common / Recent / Star / Clip / Omni) |
| `Alt + P` | `⌥ + P` | Launcher | Toggle pin window mode for continuous usage |

---

## 🐴 Lv Plugin Ecosystem

| Plugin | Core Purpose | Repository |
| :--- | :--- | :--- |
| **Lv Common** | Content asset layer, template parameterization & instant launcher | [ai68298100/xiaolv-common](https://github.com/ai68298100/xiaolv-common) |
| **Lv SpeedSwitch** | Workspace navigator and switcher connecting tabs and snippets | [ai68298100/siyuan-speed-switch](https://github.com/ai68298100/siyuan-speed-switch) |
| **Lv Checkin** | Local-first habit and goal check-in workbench | [ai68298100/siyuan-checkin](https://github.com/ai68298100/siyuan-checkin) |
| **Lv Contacts** | Relationship network, contact profiles, and interaction logs | [ai68298100/siyuan-contacts](https://github.com/ai68298100/siyuan-contacts) |
| **Lv Glean** | Clipping and deep reading review management | [ai68298100/siyuan-glean](https://github.com/ai68298100/siyuan-glean) |
| **Lv Exam** | Local exam preparation, test banks, and wrong answer review | [ai68298100/siyuan-exam](https://github.com/ai68298100/siyuan-exam) |
| **Lv Home** | Family records, living asset ledger, and reminder center | [ai68298100/siyuan-home](https://github.com/ai68298100/siyuan-home) |

---

## 💬 Community & Feedback

- **Beta Tester QQ Group**: **871707735**
- **Issue Tracker**: [GitHub Issues](https://github.com/ai68298100/xiaolv-common/issues)
- **License**: [MIT License](./LICENSE)
