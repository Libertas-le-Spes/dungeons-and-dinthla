import { Notice } from "obsidian";
import type { FolderChoices } from "../fence/folder-choices";
import { messageOf } from "../views/message-of";
import type { CampaignsFolder } from "./campaigns-folder";

export type PickFolder = (folders: string[], chosen: (folder: string) => void) => void;

export class CampaignsFolderSetup {
  constructor(
    private readonly folder: Pick<CampaignsFolder, "path" | "choose">,
    private readonly folders: Pick<FolderChoices, "folderPaths" | "make">,
    private readonly pickFolder: PickFolder,
  ) {}

  get path(): string | null {
    return this.folder.path;
  }

  folderPaths(): string[] {
    return this.folders.folderPaths();
  }

  async choose(path: string): Promise<void> {
    await this.folder.choose(path);
  }

  pick(chosen: () => void): void {
    this.pickFolder(this.folders.folderPaths(), (path) => this.chooseOrSay(path, chosen));
  }

  async make(typed: string): Promise<void> {
    const path = await this.folders.make(typed);
    await this.folder.choose(path);
  }

  private chooseOrSay(path: string, chosen: () => void): void {
    this.folder
      .choose(path)
      .then(chosen)
      .catch((error: unknown) => new Notice(`Couldn't set the Campaigns folder: ${messageOf(error)}`));
  }
}
