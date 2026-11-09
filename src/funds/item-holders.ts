import type { CachedMetadata, TFile } from "obsidian";
import type { Campaign, ItemRecord } from "../campaign/campaign";
import { campaignOfItem } from "../campaign/campaign-folders";
import type { FencedFileActions } from "../fence/fenced-file-actions";
import type { FencedFiles } from "../fence/fenced-files";
import type { FencedMetadata } from "../fence/fenced-metadata";
import { HOLDER_PROPERTY, holderPropertyOf } from "./holder-property";
import { itemOfNote } from "./item-of-note";

export interface HolderStore {
  readonly current: Campaign;
  readonly campaignFolder: string | null;
  subscribe(listener: (campaign: Campaign) => void): () => void;
}

export interface ItemHoldersNeeds {
  store: HolderStore;
  files: Pick<FencedFiles, "getMarkdownFiles">;
  metadata: Pick<FencedMetadata, "getFileCache">;
  actions: Pick<FencedFileActions, "processFrontMatter">;
  failed(error: unknown): void;
}

function holderIn(cache: CachedMetadata): unknown {
  const properties = cache.frontmatter;
  if (properties === undefined) return undefined;
  return properties[HOLDER_PROPERTY];
}

export class ItemHolders {
  private readonly writing = new Set<string>();

  constructor(private readonly needs: ItemHoldersNeeds) {}

  start(): () => void {
    this.campaignRead(this.needs.store.current);
    return this.needs.store.subscribe((campaign) => this.campaignRead(campaign));
  }

  private campaignRead(campaign: Campaign): void {
    const folder = this.needs.store.campaignFolder;
    if (folder === null) return;
    for (const file of this.needs.files.getMarkdownFiles()) {
      if (campaignOfItem(file.path, [folder]) !== null) this.keepHolder(file, campaign.items);
    }
  }

  private keepHolder(file: TFile, items: ItemRecord[]): void {
    const item = itemOfNote(items, file.path);
    if (item === null || this.writing.has(file.path)) return;
    const cache = this.needs.metadata.getFileCache(file);
    if (cache === null) return;
    const holder = holderPropertyOf(item);
    if (holderIn(cache) === holder) return;
    void this.setHolder(file, holder);
  }

  private async setHolder(file: TFile, holder: string): Promise<void> {
    this.writing.add(file.path);
    try {
      await this.needs.actions.processFrontMatter(file, (properties) => {
        properties[HOLDER_PROPERTY] = holder;
      });
    } catch (error) {
      this.needs.failed(error);
    } finally {
      this.writing.delete(file.path);
    }
  }
}
