import { Component, type EventRef, type TFile } from "obsidian";
import { mainNotePathOf } from "../../campaign/campaign-folders";
import { shownBackgroundIn, type ShownBackground } from "../../campaign/shown-background";
import { paintTabPicture } from "./tab-picture";
import type { FencedMetadata } from "../../fence/fenced-metadata";
import type { FencedFiles } from "../../fence/fenced-files";

export interface TabCampaign {
  readonly campaignFolder: string | null;
  subscribe(listener: () => void): () => void;
}

export type TabMetadata = Pick<FencedMetadata, "getCache" | "getFirstLinkpathDest" | "on" | "offref">;
export type TabFiles = Pick<FencedFiles, "getResourcePath" | "on" | "offref">;

const NO_PICTURE = "none";

function paintedKeyOf(shown: ShownBackground | null): string {
  if (shown === null) return NO_PICTURE;
  return `${shown.wash} ${shown.picture.value}`;
}

export class TabBackground extends Component {
  private painted: string | null = null;

  constructor(
    private readonly frameEl: HTMLElement,
    private readonly campaign: TabCampaign,
    private readonly metadata: TabMetadata,
    private readonly files: TabFiles,
  ) {
    super();
  }

  override onload(): void {
    this.register(this.campaign.subscribe(() => this.paint()));
    this.watchMainNote();
    this.watchFiles(this.files.on("create", () => this.paint()));
    this.watchFiles(this.files.on("rename", () => this.paint()));
    this.watchFiles(this.files.on("delete", () => this.paint()));
    this.register(() => this.clear());
    this.paint();
  }

  private watchMainNote(): void {
    const ref = this.metadata.on("changed", (file: TFile) => this.noteChanged(file.path));
    this.register(() => this.metadata.offref(ref));
  }

  private watchFiles(ref: EventRef): void {
    this.register(() => this.files.offref(ref));
  }

  private noteChanged(path: string): void {
    const folder = this.campaign.campaignFolder;
    if (folder === null || path !== mainNotePathOf(folder)) return;
    this.paint();
  }

  private paint(): void {
    const shown = this.shown();
    const key = paintedKeyOf(shown);
    if (key === this.painted) return;
    this.painted = key;
    paintTabPicture(this.frameEl, shown);
  }

  private clear(): void {
    this.painted = null;
    paintTabPicture(this.frameEl, null);
  }

  private shown(): ShownBackground | null {
    const folder = this.campaign.campaignFolder;
    if (folder === null) return null;
    return shownBackgroundIn(folder, this.metadata, (picture) => this.files.getResourcePath(picture));
  }
}
