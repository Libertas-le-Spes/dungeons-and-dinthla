import type { TFile } from "obsidian";
import { charactersBasePathOf } from "../../campaign/paths/campaign-folders";
import { messageOf } from "../../views/dialogs/message-of";

export function movedToTrash(campaignFolder: string): string {
  return `Moved ${charactersBasePathOf(campaignFolder)} to the trash: the Characters page no longer uses Bases.`;
}

export function notMovedToTrash(campaignFolder: string, error: unknown): string {
  return `Couldn't move ${charactersBasePathOf(campaignFolder)} to the trash: ${messageOf(error)} Delete it yourself if you don't need it.`;
}

export interface SweptMark {
  swept(): boolean;
  keepSwept(): Promise<void>;
}

export interface BasesNeeds {
  readonly mark: SweptMark;
  campaignsFolderChosen(): boolean;
  campaignFolders(): string[];
  fileAt(path: string): TFile | null;
  trash(file: TFile): Promise<void>;
  tell(words: string): void;
}

export class OldCharactersBases {
  constructor(private readonly needs: BasesNeeds) {}

  async sweep(): Promise<void> {
    if (this.needs.mark.swept() || !this.needs.campaignsFolderChosen()) return;
    for (const folder of this.needs.campaignFolders()) await this.sweepIn(folder);
    await this.needs.mark.keepSwept();
  }

  private async sweepIn(folder: string): Promise<void> {
    const file = this.needs.fileAt(charactersBasePathOf(folder));
    if (file === null) return;
    try {
      await this.needs.trash(file);
      this.needs.tell(movedToTrash(folder));
    } catch (error) {
      this.needs.tell(notMovedToTrash(folder, error));
    }
  }
}
