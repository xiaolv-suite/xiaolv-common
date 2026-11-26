// 设置与引导界面的上下文契约类型
import type {LibraryConfig, PluginState, SavedDiscoveryView} from "../model/storage";
import type {LibraryService} from "../service/library";
import type {AiAssistant} from "../service/ai";
import type {ProviderRegistry} from "../service/providers";
import type {ExportedItem, ConflictPolicy, ImportReceipt} from "../model/transfer";

export type TFn = (key: string, ...args: string[]) => string;

export interface SettingsUiContext {
    t: TFn;
    state: PluginState;
    getConfig(): LibraryConfig | null;
    library: LibraryService;
    ai: AiAssistant;
    registry: ProviderRegistry;
    notify(kind: "info" | "error", message: string): void;
    applyConfig(config: LibraryConfig): void;
    persistSoon(): void;
    exportBundle(): Promise<string>;
    importBundleText(text: string, policy: ConflictPolicy): Promise<ImportReceipt>;
    importMarkdownItems(items: ReadonlyArray<ExportedItem>, policy: ConflictPolicy): Promise<ImportReceipt>;
    fetchAssetBytes(assetPath: string): Promise<Uint8Array | null>;
    aiErrorText(err: unknown): string;
    applyPinyinAdapter(): void;
    refreshSearch?(): void;
    openLibraryDoc?(): void;
    getSavedDiscoveryViews?(): readonly SavedDiscoveryView[];
    openSavedDiscoveryView?(view: SavedDiscoveryView): void;
    deleteSavedDiscoveryView?(id: string): void;
}

export interface SetupDialogOptions {
    onConfigured?: () => void;
    onDismiss?: () => void;
}
