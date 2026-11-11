import { debounce, type Debouncer } from "obsidian";
import type { BackgroundMetadata } from "../campaign/background/campaign-background";
import { campaignFolderOf, isMainNote } from "../campaign/paths/campaign-folders";
import { shownBackgroundIn, type PictureUrl, type ShownBackground } from "../campaign/background/shown-background";
import type { ReadCampaignsFolder } from "../fence/paths/fence";

const SETTLE_MS = 200;
const LAYER_CLASS = "dd-campaign-background";
const HOLDER_CLASS = "dd-has-campaign-background";

export function shownBackgroundOf(
  notePath: string,
  campaignFolders: string[],
  metadata: BackgroundMetadata,
  urlOf: PictureUrl,
): ShownBackground | null {
  const folder = campaignFolderOf(notePath, campaignFolders);
  if (folder === null) return null;
  return shownBackgroundIn(folder, metadata, urlOf);
}

const LAYERS = new WeakMap<HTMLElement, HTMLElement>();

function layerIn(contentEl: HTMLElement): HTMLElement | null {
  const layer = LAYERS.get(contentEl);
  if (layer === undefined) return null;
  return layer;
}

export function showBackground(contentEl: HTMLElement, shown: ShownBackground | null): void {
  let layer = layerIn(contentEl);
  if (shown === null) {
    if (layer !== null) layer.remove();
    LAYERS.delete(contentEl);
    contentEl.removeClass(HOLDER_CLASS);
    return;
  }
  if (layer === null) {
    layer = contentEl.createDiv({ prepend: true });
    LAYERS.set(contentEl, layer);
  }
  layer.className = `dd-tokens ${LAYER_CLASS} dd-wash-${shown.wash}`;
  layer.setCssProps({ "--dd-campaign-picture": shown.picture.value });
  contentEl.addClass(HOLDER_CLASS);
}

export class BackgroundRefresh {
  private readonly soon: Debouncer<[], void>;

  constructor(
    refresh: () => void,
    private readonly readCampaignsFolder: ReadCampaignsFolder,
  ) {
    this.soon = debounce(refresh, SETTLE_MS, true);
  }

  noteChanged(path: string): void {
    if (isMainNote(path, this.readCampaignsFolder())) this.soon();
  }

  layoutChanged(): void {
    this.soon();
  }

  cancel(): void {
    this.soon.cancel();
  }
}
