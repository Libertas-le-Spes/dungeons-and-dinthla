import type { TFile } from "obsidian";
import { backgroundOf, type BackgroundMetadata, type Wash } from "./campaign-background";

export interface ShownBackground {
  url: string;
  wash: Wash;
}

export type PictureUrl = (picture: TFile) => string;

export function shownBackgroundIn(campaignFolder: string, metadata: BackgroundMetadata, urlOf: PictureUrl): ShownBackground | null {
  const background = backgroundOf(campaignFolder, metadata);
  if (background.picture === null) return null;
  return { url: urlOf(background.picture), wash: background.wash };
}
