import { Platform, type TFile } from "obsidian";
import { backgroundOf, type BackgroundMetadata, type Wash } from "./campaign-background";
import { PictureCss } from "./picture-css";

export interface ShownBackground {
  picture: PictureCss;
  wash: Wash;
}

export type PictureUrl = (picture: TFile) => string;

export function shownBackgroundIn(campaignFolder: string, metadata: BackgroundMetadata, urlOf: PictureUrl): ShownBackground | null {
  const background = backgroundOf(campaignFolder, metadata);
  if (background.picture === null) return null;
  const picture = PictureCss.of(urlOf(background.picture), Platform);
  if (picture === null) return null;
  return { picture, wash: background.wash };
}
