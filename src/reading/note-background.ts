import { debounce, type Debouncer, type TFile } from "obsidian";
import { backgroundOf, type BackgroundMetadata, type Wash } from "../campaign/campaign-background";
import { campaignFolderOf, isMainNote } from "../campaign/campaign-folders";

const SETTLE_MS = 200;
const LAYER_CLASS = "dd-campaign-background";
const HOLDER_CLASS = "dd-has-campaign-background";

export interface ShownBackground {
  url: string;
  wash: Wash;
}

export function shownBackgroundOf(
  notePath: string,
  campaignFolders: string[],
  metadata: BackgroundMetadata,
  urlOf: (picture: TFile) => string,
): ShownBackground | null {
  const folder = campaignFolderOf(notePath, campaignFolders);
  if (folder === null) return null;
  const background = backgroundOf(folder, metadata);
  if (background.picture === null) return null;
  return { url: urlOf(background.picture), wash: background.wash };
}

function layerIn(contentEl: HTMLElement): HTMLElement | null {
  for (const child of Array.from(contentEl.children)) {
    if (child.classList.contains(LAYER_CLASS)) return child as HTMLElement;
  }
  return null;
}

export function showBackground(contentEl: HTMLElement, shown: ShownBackground | null): void {
  let layer = layerIn(contentEl);
  if (shown === null) {
    if (layer !== null) layer.remove();
    contentEl.removeClass(HOLDER_CLASS);
    return;
  }
  if (layer === null) layer = contentEl.createDiv({ prepend: true });
  layer.className = `dd-tokens ${LAYER_CLASS} dd-wash-${shown.wash}`;
  layer.setCssProps({ "--dd-campaign-picture": `url("${shown.url}")` });
  contentEl.addClass(HOLDER_CLASS);
}

export class BackgroundRefresh {
  private readonly soon: Debouncer<[], void>;

  constructor(refresh: () => void) {
    this.soon = debounce(refresh, SETTLE_MS, true);
  }

  noteChanged(path: string): void {
    if (isMainNote(path)) this.soon();
  }

  layoutChanged(): void {
    this.soon();
  }

  cancel(): void {
    this.soon.cancel();
  }
}
