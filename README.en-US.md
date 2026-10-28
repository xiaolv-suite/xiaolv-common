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

## 🛠️ Feature Overview

### 1. Asset Management & Architecture
- **Real Block Single Source of Truth**: Data lives in native SiYuan blocks with `custom-xlc-*` attributes. Sidecar storage holds only local preferences.
- **Rich Types**: Text, Markdown, Code (with syntax highlighting), URL, Image, Asset, Blockref, Structure.
- **Semantic Badges & Hierarchical Tags**: Predefined color badges and nested `/` slash tag navigation.
- **Frecency Smart Ranking**: Combines frequency with time decay (24h/7d/30d/90d) for optimal ordering.

### 2. Dynamic Variables & Macro Engine
- **Interactive Forms**: `{{xlc:ask:name}}`, dropdowns, multi-select, textareas, default values, and presets.
- **Date & Time**: `{{xlc:date}}`, `{{xlc:date|+3d}}`, `{{xlc:date|tomorrow}}`, `{{xlc:timeago|timestamp}}`.
- **Computation & Helpers**:
  - `{{xlc:calc|100*1.13}}`: Recursive-descent math parser;
  - `{{xlc:uuid}}` / `{{xlc:id|12}}`: Standard UUID and compact short ID;
  - `{{xlc:password|16}}`: Secure random password generator;
  - `{{xlc:currency|1234.56}}`: Chinese currency uppercase characters;
  - `{{xlc:case:camel|text}}`: Case and naming convention transformer;
  - `{{xlc:hash|text}}`: Deterministic hash fingerprint (FNV-1a / CRC32);
  - `{{xlc:mask|phone|number}}`: Sensitive data masking (`138****8000`);
  - `{{xlc:count:chars|text}}`: Character and word counter;
  - `{{xlc:filesize|1048576}}`: Byte capacity human-readable formatter;
  - `{{xlc:lunar:year}}`: Chinese lunar stem-branch and zodiac calculator;
  - `{{xlc:snippet:title}}`: Nested snippet expansion;
  - `{{xlc:selection}}`: Surround selection placeholder.

### 3. Formatting Toolbox (Actions & Form Toolbar)
30+ pure utility functions:
- **Typography**: Pangu spacing, Title Case formatting, equal-width padding, line numbering.
- **Tables & Structure**: TSV to Markdown table, table alignment, CSV/TSV to JSON, task status toggling.
- **Multi-line Tools**: Batch affixing/stripping, join/split lines, deduplication, sorting, shuffling.
- **Technical Transforms**: UTF-8 Base64, URL encoding, HTML entity escaping, JSON/Properties conversion, Tab/space indentation.
- **Text Extraction**: Markdown links & images extraction, executive summary, word frequency distribution.

### 4. Omni-Search & Global Automation
- **Zero-SQL Omni-Search**: Search across all workspace note blocks via `@`, `/`, or `sy:`.
- **Paste Queue (Stacking Mode)**: Multi-select items and sequentially paste with `⌥⇧Q`.
- **Global Integration**: Window bridge `window.xiaolvCommon`, protocol commands, Quicker, Raycast, and AutoHotkey scripts.

---

## 🔒 Security Baseline & Known Boundaries

- **B-006 Kramdown Pre-write Safeguards**: To prevent parser runaway, single-line text or a complete code fence is accepted for writes. Multi-line snippets should use code blocks or block references.
- **Zero-SQL Redline**: Strictly zero calls to `/api/query/sql`; all operations rely on official structured APIs.
- **Mobile Environment**: Touch and image clipboard operations on Android operate under graceful fallbacks.

---

## 🆕 Latest Release Highlights

### [v0.10.53] — 2026-10-29 (Latest)

Markdown code fence language tagging, macro pipe delimiter escape macro, and multi-column grid formatting:
- **Code Fence Language Tagging (`setMarkdownCodeFenceLang`)**: Pure function tracking code fences and batch-setting missing language tags (e.g. `ts`, `json`) on bare code blocks with overwrite option; wired to action menu and variable form.
- **Macro Parameter Pipe Delimiter Escaping (`escapeMacroPipe`) & `{{xlc:escape}}` Macro**: Pure function encoding and decoding pipe symbols (`|` <-> `\|`) to eliminate syntax conflicts within nested template macros; expanded dynamic macro `{{xlc:escape|a|b|c}}` and `{{xlc:escape:unescape|a\|b}}`; wired to action menu and variable form.
- **Multi-column Grid Formatter (`formatTextColumnsGrid`)**: Pure function formatting multi-line text into a visual $N$-column grid with equalized visual padding supporting CJK double-width calculation; wired to action menu and variable form.
- **Quality Gates**: Unit test suite expanded to 962/962 passing tests with verified negative tests.

<details>
<summary><b>📜 Click to expand historical releases (v0.10.0 ~ v0.10.52)</b></summary>

#### [v0.10.52] — 2026-10-29
- Key-value to Markdown table (`keyValueToMarkdownTable`).
- English plural/singular toggle (`pluralizeText`) & `{{xlc:plural}}` macro.
- Markdown outline TOC generator (`generateMarkdownToc`).

#### [v0.10.51] — 2026-10-29
- Markdown table to key-value & YAML (`markdownTableToKeyValue`).
- Chinese Pinyin initials extraction (`extractChinesePinyinInitials`) & `{{xlc:initials}}` macro.
- Strict blank lines normalization (`normalizeBlankLinesStrict`).

#### [v0.10.50] — 2026-10-29
- Markdown links conversion & extraction (`convertMarkdownLinks`).
- UTF-8 byte boundary truncation (`truncateByBytes`) & `{{xlc:btruncate}}` macro.
- Punctuation spacing formatting (`formatPunctuationSpacing`).

#### [v0.10.49] — 2026-10-29
- Prefix/suffix line filtering (`filterLinesByAffix`).
- Random color code generator (`generateRandomColor`) & `{{xlc:randomcolor}}` macro.
- Markdown ordered list renumbering (`renumberOrderedList`).

#### [v0.10.48] — 2026-10-29
- Markdown list style bidirectional conversion (`convertListStyle`).
- Lightweight short hash fingerprint (`generateShortHash`) & `{{xlc:fingerprint}}` macro.
- Task list status filtering (`filterTaskItems`) with checkbox stripping.

#### [v0.10.47] — 2026-10-29
- Identifier naming style conversion (`convertIdentifierNamingStyle`) for camelCase, snake_case, PascalCase, and kebab-case.
- Numeric sequence generation (`generateNumericSequence`) & `{{xlc:seq}}` macro.
- Markdown table to CSV/TSV export (`markdownTableToDelimited`) with RFC 4180 escaping.

#### [v0.10.46] — 2026-10-29
- Markdown table column alignment batch conversion (`alignMarkdownTableColumns`).
- Fixed-width field pad & truncate (`padOrTruncate`) & `{{xlc:pad}}` macro.
- Line endings & NBSP sanitization engine (`sanitizeLineEndingsAndSpaces`).

#### [v0.10.45] — 2026-10-29
- Safe code comments stripping (`stripCodeComments`) while protecting string literals.
- Line grouping by prefix pattern (`groupLinesByPattern`) with H3 summaries.
- Markdown HRules normalization (`normalizeHorizontalRules`) with heading trap protection.

#### [v0.10.44] — 2026-10-29
- Markdown blockquote nesting level shifting (`shiftMarkdownBlockquotes`).
- Lightweight checksum engine (`calculateChecksum`) & `{{xlc:checksum}}` macro.
- Equal-width column alignment (`alignDelimitedColumns`).

#### [v0.10.43] — 2026-10-29
- Markdown task list progress (`calculateTaskProgress`).
- Line slicing by start and end pattern (`sliceLinesByPattern`).
- Thousands number grouping (`formatNumberGrouping`) & `{{xlc:thousands}}` macro.

#### [v0.10.42] — 2026-10-29
- Code language detection (`detectCodeLanguage`).
- Word/character scrambling (`scrambleText`) & `{{xlc:scramble}}` macro.
- Repetitive punctuation compacting (`compactRepeatedCharacters`).

#### [v0.10.41] — 2026-10-29
- Markdown heading level shifting (`shiftMarkdownHeadings`).
- Idempotent line affixes (`ensureLineAffixes`).
- Multiline regex anchors (`regexReplaceMultiline`) & macro.

#### [v0.10.40] — 2026-10-29
- Adaptive punctuation correction (`normalizePunctuationAdaptive`).
- Text obfuscation (`obfuscateText`) & `{{xlc:obfuscate}}` macro.
- Fixed width text wrapping (`wrapTextLines`).

#### [v0.10.39] — 2026-10-29
- Multi-line code comments toggle (`toggleLineComments`).
- Simple template variable interpolation (`renderSimpleTemplate`) & `{{xlc:template}}` macro.
- Brackets balance checker (`checkBracketsBalance`).

#### [v0.10.38] — 2026-10-29
- Unit spacing formatting (`formatUnitSpacing`).
- Character set filtering (`filterCharacterSet`).
- Compact unique NanoID generator (`generateNanoId`) & `{{xlc:nanoid}}` macro.

#### [v0.10.37] — 2026-10-29
- Smart quotes normalization (`normalizeSmartQuotes`).
- Multi-line interleaving (`interleaveLines`).
- Object keys case converter (`convertObjectKeysCase`).

#### [v0.10.36] — 2026-10-29
- Line parts swapping (`swapLineParts`).
- Path and URL component parsing (`parsePathParts`) & `{{xlc:path}}` macro.
- Deduplication with occurrence counts (`deduplicateWithCount`).

#### [v0.10.35] — 2026-10-29
- Multi-line custom indentation/outdentation (`indentLines`/`outdentLines`).
- Data format validation (`validateFormat`) & `{{xlc:valid}}` macro.
- Markdown table column filter (`filterMarkdownTable`).

#### [v0.10.34] — 2026-10-28
- Key-value pair extraction (`parseKeyValuePairs`) & `{{xlc:kv}}` macro.
- Column-based multi-line sorting (`sortLinesByColumn`).
- Regex capture group formatting (`formatByRegexGroups`) & `{{xlc:match}}` macro.

#### [v0.10.33] — 2026-10-28
- Line set operations (`setOperationsOnLines`).
- Multi-radix conversion (`convertRadix`) & `{{xlc:radix}}` macro.
- Code variable affix stripper (`stripAffixWords`).

#### [v0.10.32] — 2026-10-28
- Pairwise line merging (`zipLines`).
- Advanced numeric statistics (`calculateStats`) & `{{xlc:stats}}` macro.
- Title to Slug converter (`slugifyText`).

#### [v0.10.31] — 2026-10-28
- Lightweight line-level diff (`diffLinesQuick`).
- Color format conversion (`convertColorFormat`) & `{{xlc:color}}` macro.
- Identifier humanization (`humanizeIdentifier`).

#### [v0.10.30] — 2026-10-28
- Table matrix transposition (`transposeMatrixText`).
- Number to English words (`numberToEnglishWords`) & `{{xlc:words:en}}` macro.
- English contractions expansion (`expandEnglishContractions`).

#### [v0.10.29] — 2026-10-28
- Multi-line column extraction (`extractColumnFromLines`).
- Weighted random choice (`pickWeightedOption`) & `{{xlc:choose}}` macro.
- English noun pluralization (`pluralizeText`).

#### [v0.10.28] — 2026-10-28
- Multi-line numeric lines summary (`sumNumericLines`).
- Chinese lunar year & zodiac calculator (`getChineseZodiacAndStemBranch`) and `{{xlc:lunar:year}}` macro.
- Repeated phrases extraction (`extractRepeatedPhrases`).

#### [v0.10.27] — 2026-10-28
- Line symmetrical surrounding (`surroundEachLine`) with quotes/brackets.
- Executive summary extraction (`extractExecutiveSummary`) and `{{xlc:summary}}` macro.
- Leading indentation conversion (`convertIndentation`) between spaces and tabs.

#### [v0.10.26] — 2026-10-28
- Consecutive empty lines compacting (`compactBlankLines`).
- Relative time formatting (`formatRelativeTime`) and `{{xlc:timeago}}` macro.
- Word frequency distribution analysis (`countWordFrequency`).

#### [v0.10.25] — 2026-10-28
- Multi-line equal width padding and alignment (`padLines`).
- Natural language Cron expression parser (`explainCronExpression`) and `{{xlc:cron}}` macro.
- Simplified and Traditional Chinese character converter (`convertChineseVariant`).

#### [v0.10.24] — 2026-10-28
- Line filtering engine (`filterLines`) with invert matching.
- Unicode and Emoji safe character reversal (`reverseText`) and `{{xlc:reverse}}` macro.
- Bidirectional Roman and Arabic numeral converter (`romanToArabic`/`arabicToRoman`).

#### [v0.10.23] — 2026-10-28
- Strip Markdown formatting down to clean plain text (`stripMarkdownFormatting`).
- Byte capacity formatting (`formatByteSize`) and `{{xlc:filesize}}` macro.
- Multi-line random shuffling (`shuffleLines`) based on Fisher-Yates algorithm.

#### [v0.10.22] — 2026-10-28
- Join multi-lines with delimiters and split text to lines.
- Chinese currency uppercase character formatting (`formatChineseCurrency`) and `{{xlc:currency}}` macro.
- Acronym and initials extraction (`extractInitials`).

#### [v0.10.21] — 2026-10-28
- Batch prefix/suffix stripping (`stripAffixes`).
- Properties and JSON bidirectional conversion (`propertiesToJson`/`jsonToProperties`).
- Sensitive text masking (`maskSensitiveText`) and `{{xlc:mask}}` macro.

#### [v0.10.20] — 2026-10-28
- Advanced whitespace and document-end trimming (`trimLinesAdvanced`).
- Object quotes normalization (`normalizeObjectQuotes`).
- Text truncation (`truncateText`) and `{{xlc:truncate}}` macro.

#### [v0.10.0 ~ v0.10.19]
See [CHANGELOG.md](./CHANGELOG.md) for full historical details.
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
