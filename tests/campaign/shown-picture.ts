import type { Wash } from "../../src/campaign/background/wash";
import { PictureCss, type ResourcePlatform } from "../../src/obsidian/campaign/background/picture-css";
import type { ShownBackground } from "../../src/obsidian/campaign/background/shown-background";

export const DESKTOP: ResourcePlatform = { isDesktopApp: true, isIosApp: false, isAndroidApp: false };
export const IPHONE: ResourcePlatform = { isDesktopApp: false, isIosApp: true, isAndroidApp: false };
export const ANDROID: ResourcePlatform = { isDesktopApp: false, isIosApp: false, isAndroidApp: true };

export function shownPicture(url: string, wash: Wash): ShownBackground {
  const picture = PictureCss.of(url, DESKTOP);
  if (picture === null) throw new Error(`${url} is not a desktop picture`);
  return { picture, wash };
}

export function pictureOf(element: HTMLElement): string {
  return element.style.getPropertyValue("--dd-campaign-picture");
}
