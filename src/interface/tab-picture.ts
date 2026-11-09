import { WASHES, type Wash } from "../campaign/campaign-background";
import type { ShownBackground } from "../campaign/shown-background";

const PICTURE_CLASS = "dd-tab-picture";
const PICTURE_PROPERTY = "--dd-campaign-picture";

function washClassOf(wash: Wash): string {
  return `dd-tab-wash-${wash}`;
}

function clearPicture(frameEl: HTMLElement): void {
  for (const wash of WASHES) frameEl.removeClass(washClassOf(wash));
  frameEl.removeClass(PICTURE_CLASS);
  frameEl.style.removeProperty(PICTURE_PROPERTY);
}

export function paintTabPicture(frameEl: HTMLElement, shown: ShownBackground | null): void {
  clearPicture(frameEl);
  if (shown === null) return;
  frameEl.addClass(PICTURE_CLASS, washClassOf(shown.wash));
  frameEl.setCssProps({ [PICTURE_PROPERTY]: shown.picture.value });
}
