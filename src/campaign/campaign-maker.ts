import { Notice } from "obsidian";
import { messageOf } from "../views/message-of";
import { makeCampaign, type NewCampaignVault } from "./make-campaign";

export type ChooseCampaign = (folder: string) => Promise<void>;

export class CampaignMaker {
  constructor(
    private readonly vault: NewCampaignVault,
    private readonly choose: ChooseCampaign,
  ) {}

  async make(name: string): Promise<void> {
    try {
      const folder = await makeCampaign(this.vault, name);
      await this.choose(folder);
    } catch (error) {
      new Notice(`Couldn't make the campaign: ${messageOf(error)}`);
    }
  }
}
