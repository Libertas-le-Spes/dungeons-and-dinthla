import type { App } from "obsidian";
import { Fence, type CampaignsFolderPath } from "./fence";
import { FencedFileActions } from "./fenced-file-actions";
import { FencedFiles } from "./fenced-files";
import { FencedMetadata } from "./fenced-metadata";
import { FolderChoices } from "./folder-choices";
import { HeldFiles } from "./held-files";
import { VaultSettings } from "./vault-settings";

export class Gatekeeper {
  readonly fence: Fence;
  readonly files: FencedFiles;
  readonly fileActions: FencedFileActions;
  readonly metadata: FencedMetadata;
  readonly settings: VaultSettings;
  readonly folders: FolderChoices;

  constructor(app: App, campaignsFolder: CampaignsFolderPath) {
    this.fence = new Fence(campaignsFolder);
    const held = new HeldFiles(app.vault, this.fence);
    this.files = new FencedFiles(app.vault, this.fence);
    this.fileActions = new FencedFileActions(app.fileManager, held);
    this.metadata = new FencedMetadata(app.metadataCache, held);
    this.settings = new VaultSettings(app.vault);
    this.folders = new FolderChoices(app.vault);
  }
}
