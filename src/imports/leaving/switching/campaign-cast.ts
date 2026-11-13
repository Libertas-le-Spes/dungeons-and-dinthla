import type { TFile } from "obsidian";
import type { Identity } from "../record/record-facts";

export interface CampaignCast {
  mainOf(campaignFolder: string): TFile | null;
  identityOf(file: TFile): Identity;
  newestSessionLink(campaignFolder: string, fromPath: string): string | null;
  linkTo(file: TFile, fromPath: string): string;
}
