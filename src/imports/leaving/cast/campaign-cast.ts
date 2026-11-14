import type { TFile } from "obsidian";
import type { Campaign } from "../../../campaign/record/campaign";

export interface CampaignCast {
  mainFrom(campaignNote: TFile, asked: string): TFile | null;
  campaignOf(campaignFolder: string): Promise<Campaign>;
  latestSessionLink(campaignFolder: string, fromPath: string): string | null;
  linkTo(file: TFile, fromPath: string): string;
}
