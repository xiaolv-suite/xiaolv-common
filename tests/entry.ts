// 测试专用单一入口：所有被测模块打进同一个 bundle，保证模块实例唯一
// （如 pinyin.ts 的模块级适配器状态在 search 与测试间共享）。
import * as item from "../src/model/item";
import * as storage from "../src/model/storage";
import * as protocol from "../src/model/protocol";
import * as actions from "../src/model/actions";
import * as search from "../src/model/search";
import * as pinyin from "../src/model/pinyin";
import * as transfer from "../src/model/transfer";
import * as client from "../src/kernel/client";
import * as lru from "../src/model/lru";
import * as zip from "../src/model/zip";
import * as kramdown from "../src/model/kramdown";
import * as pinyin from "../src/model/pinyin";
import * as pinyinTiny from "../src/model/pinyin-tiny";
import * as placeholders from "../src/model/placeholders";
import * as kramdown from "../src/model/kramdown";
import * as errors from "../src/model/errors";
import * as variables from "../src/model/variables";
import * as providerSection from "../src/model/provider-section";
import * as exportMarkdown from "../src/service/export-markdown";
import * as importMarkdown from "../src/service/import-markdown";
import * as promptPack from "../src/service/prompt-pack";
import * as dedupe from "../src/model/dedupe";
import * as capture from "../src/ui/capture";
import * as importer from "../src/service/importer";
import * as espanso from "../src/service/espanso-import";
import * as csvTsvImport from "../src/service/csv-tsv-import";
import * as library from "../src/service/library";
import * as commands from "../src/service/commands";
import * as providers from "../src/service/providers";
import * as service from "../src/service/service";
import * as ai from "../src/service/ai";
import * as startup from "../src/model/startup";
import * as textFormatting from "../src/service/text-formatting";
import * as externalBridge from "../src/service/external-bridge";
import * as discovery from "../src/service/discovery";
import * as discoveryTarget from "../src/model/discovery-target";
import * as emptyState from "../src/ui/empty-state";
import * as previewRenderer from "../src/ui/preview-renderer";
import * as hierarchy from "../src/model/hierarchy";
import * as omniSearch from "../src/service/omni-search";
import * as quickEdit from "../src/ui/quick-edit";
import * as clipboard from "../src/model/clipboard";
import * as calculator from "../src/model/calculator";
import * as variableMemory from "../src/model/variable-memory";
import * as variableForm from "../src/ui/variable-form";
import * as healthDoctor from "../src/model/health-doctor";
import * as usageInsights from "../src/model/usage-insights";
import * as batchOps from "../src/model/batch-ops";
import * as exportSanitizer from "../src/model/export-sanitizer";
import * as exportSanitizerModal from "../src/ui/export-sanitizer-modal";
import * as syncDiff from "../src/model/sync-diff";
import * as syncDiffModal from "../src/ui/sync-diff-modal";
import * as ecosystem from "../src/service/ecosystem";
import * as clipboardCleaner from "../src/model/clipboard-cleaner";
import * as pasteQueue from "../src/model/paste-queue";
import * as pasteQueueService from "../src/service/paste-queue";
import * as templateWizard from "../src/model/template-wizard";
import * as textMetrics from "../src/model/text-metrics";
import * as dockView from "../src/ui/dock-view";
import * as csvTsvWizard from "../src/ui/csv-tsv-wizard";
import * as hotkeys from "../src/model/hotkeys";
import * as performanceUtils from "../src/ui/performance-utils";
import * as shareCard from "../src/ui/share-card";
import * as expansion from "../src/model/expansion";
import * as contextualRecommend from "../src/model/contextual-recommend";
import * as pinboard from "../src/ui/pinboard";
import * as starterPacksDialog from "../src/ui/starter-packs-dialog";
import * as promoteClip from "../src/ui/promote-clip";
import * as lvNoticeKit from "../src/libs/lv-notice-kit";

export {
    item,
    storage,
    protocol,
    actions,
    search,
    pinyin,
    pinyinTiny,
    placeholders,
    kramdown,
    errors,
    variables,
    providerSection,
    exportMarkdown,
    importMarkdown,
    promptPack,
    dedupe,
    capture,
    importer,
    espanso,
    csvTsvImport,
    transfer,
    client,
    lru,
    zip,
    library,
    commands,
    providers,
    service,
    ai,
    startup,
    externalBridge,
    discovery,
    discoveryTarget,
    emptyState,
    previewRenderer,
    hierarchy,
    omniSearch,
    quickEdit,
    clipboard,
    calculator,
    variableMemory,
    variableForm,
    healthDoctor,
    usageInsights,
    batchOps,
    exportSanitizer,
    exportSanitizerModal,
    syncDiff,
    syncDiffModal,
    ecosystem,
    clipboardCleaner,
    pasteQueue,
    pasteQueueService,
    templateWizard,
    textMetrics,
    textFormatting,
    dockView,
    csvTsvWizard,
    hotkeys,
    performanceUtils,
    shareCard,
    expansion,
    contextualRecommend,
    pinboard,
    starterPacksDialog,
    promoteClip,
    lvNoticeKit,
};
