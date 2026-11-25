import type { Wash } from "../../campaign/background/wash";

export interface CampaignLook {
  readonly picturePath: string | null;
  readonly wash: Wash;
}

export interface CampaignLooks {
  lookOf(campaignFolder: string): CampaignLook;
  pictures(): string[];
  choosePicture(campaignFolder: string, picturePath: string): Promise<void>;
  removePicture(campaignFolder: string): Promise<void>;
  chooseWash(campaignFolder: string, wash: Wash): Promise<void>;
}

export type PickPicture = (pictures: string[], chosen: (picturePath: string) => void) => void;
