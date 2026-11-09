import { Notice } from "obsidian";
import { messageOf } from "../views/message-of";
import { makeCampaign, type NewCampaignFiles } from "./make-campaign";

export type ChooseCampaign = (folder: string) => Promise<void>;

export type CampaignsFolderOf = () => string | null;

export class CampaignMaker {
  constructor(
    private readonly files: NewCampaignFiles,
    private readonly campaignsFolder: CampaignsFolderOf,
    private readonly choose: ChooseCampaign,
  ) {}

  async make(name: string): Promise<void> {
    const folder = await this.madeFolder(name);
    if (folder === null) return;
    await this.moveInto(folder);
  }

  private async madeFolder(name: string): Promise<string | null> {
    try {
      return await makeCampaign(this.files, this.campaignsFolder(), name);
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
