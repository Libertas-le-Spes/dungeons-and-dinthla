import { OBSIDIAN_SPELLING } from "../../obsidian/notes/obsidian-spelling";
import type { App } from "obsidian";
import { Fence, type ReadCampaignsFolder } from "../paths/fence";
import { FencedFileActions } from "./fenced-file-actions";
import { FencedFiles } from "./fenced-files";
import { FencedMetadata } from "./fenced-metadata";
import { FolderChoices } from "./folder-choices";
import { HeldFiles } from "./held-files";
import { NoteReporter, type WrittenNotes } from "./written-notes";
import { configReaderOf, VaultSettings } from "./vault-settings";

export class Gatekeeper {
  readonly fence: Fence;
  readonly files: FencedFiles;
  readonly fileActions: FencedFileActions;
  readonly metadata: FencedMetadata;
  readonly vaultSettings: VaultSettings;
  readonly folders: FolderChoices;
  readonly written: WrittenNotes;
  readonly configDir: string;

  constructor(app: App, readCampaignsFolder: ReadCampaignsFolder) {
    this.configDir = app.vault.configDir;
    this.fence = new Fence(readCampaignsFolder, this.configDir, OBSIDIAN_SPELLING);
    const held = new HeldFiles(app.vault, this.fence);
    const reporter = new NoteReporter();
    this.written = reporter.notes;
    this.files = new FencedFiles(app.vault, held, reporter);
    this.fileActions = new FencedFileActions(app.fileManager, held, reporter);
    this.metadata = new FencedMetadata(app.metadataCache, held);
    this.vaultSettings = new VaultSettings(configReaderOf(app));
    this.folders = new FolderChoices(app.vault);
  }
}

export type Gate = Pick<Gatekeeper, "files" | "fileActions" | "metadata">;
