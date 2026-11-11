import type { TFolder, Vault } from "obsidian";
import { isInConfigFolder, newCampaignsFolderPathOf, NOT_THE_CONFIG_FOLDER, refusalForCampaignsFolder } from "../paths/campaigns-folder-path";

export type FolderVault = Pick<Vault, "getAllFolders" | "getFolderByPath" | "getAbstractFileByPath" | "createFolder" | "configDir">;

export const A_FILE_HAS_THAT_NAME = "A file already has that name. Pick another name for the Campaigns folder.";

function pathOfFolder(folder: TFolder): string {
  return folder.path;
}

export class FolderChoices {
  constructor(private readonly vault: FolderVault) {}

  folderPaths(): string[] {
    const paths = this.vault.getAllFolders(false).map(pathOfFolder);
    return paths.filter((path) => this.canHoldCampaigns(path)).sort();
  }

  async make(typed: string): Promise<string> {
    const path = newCampaignsFolderPathOf(typed);
    if (this.isInConfigFolder(path)) throw new Error(NOT_THE_CONFIG_FOLDER);
    if (this.vault.getFolderByPath(path) !== null) return path;
    if (this.vault.getAbstractFileByPath(path) !== null) throw new Error(A_FILE_HAS_THAT_NAME);
    await this.vault.createFolder(path);
    return path;
  }

  private canHoldCampaigns(path: string): boolean {
    return refusalForCampaignsFolder(path) === null && !this.isInConfigFolder(path);
  }

  private isInConfigFolder(path: string): boolean {
    return isInConfigFolder(path, this.vault.configDir);
  }
}
