import { Notice } from "obsidian";
import type { ReadCampaignsFolder } from "../../fence/paths/fence";
import type { PathSpelling } from "../../host/rules/path-spelling";
import { messageOf } from "../../views/dialogs/message-of";
import { makeCampaign, type NewCampaignFiles } from "./make-campaign";

export type ChooseCampaign = (folder: string) => Promise<void>;

export class CampaignMaker {
  constructor(
    private readonly files: NewCampaignFiles,
    private readonly readCampaignsFolder: ReadCampaignsFolder,
    private readonly choose: ChooseCampaign,
    private readonly spelling: PathSpelling,
  ) {}

  async make(name: string): Promise<boolean> {
    const folder = await this.madeFolder(name);
    if (folder === null) return false;
    await this.moveInto(folder);
    return true;
  }

  private async madeFolder(name: string): Promise<string | null> {
    try {
      return await makeCampaign(this.files, this.readCampaignsFolder(), name, this.spelling);
    } catch (error) {
      new Notice(`Couldn't make the campaign: ${messageOf(error)}`);
      return null;
    }
  }

  private async moveInto(folder: string): Promise<void> {
    try {
      await this.choose(folder);
    } catch (error) {
      new Notice(`Made ${folder}, but couldn't move into it: ${messageOf(error)}`);
    }
  }
}
