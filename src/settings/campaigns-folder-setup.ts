import { Notice } from "obsidian";
import type { FolderChoices } from "../fence/folder-choices";
import { messageOf } from "../views/message-of";
import type { CampaignsFolderSetting } from "./campaigns-folder-setting";

export type PickFolder = (folders: string[], chosen: (folder: string) => void) => void;

export class CampaignsFolderSetup {
  constructor(
    private readonly setting: Pick<CampaignsFolderSetting, "path" | "choose">,
    private readonly folders: Pick<FolderChoices, "folderPaths" | "make">,
    private readonly pickFolder: PickFolder,
  ) {}

  get path(): string | null {
    return this.setting.path;
  }

  folderPaths(): string[] {
    return this.folders.folderPaths();
  }

  async choose(path: string): Promise<void> {
    await this.setting.choose(path);
  }

  pick(chosen: () => void): void {
    this.pickFolder(this.folders.folderPaths(), (path) => this.chooseOrSay(path, chosen));
  }

  async make(typed: string): Promise<void> {
    const path = await this.folders.make(typed);
    await this.setting.choose(path);
  }

  private chooseOrSay(path: string, chosen: () => void): void {
    this.setting
      .choose(path)
      .then(chosen)
      .catch((error: unknown) => new Notice(`Couldn't set the Campaigns folder: ${messageOf(error)}`));
  }
}
