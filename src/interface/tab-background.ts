import { Component, type EventRef, type MetadataCache, type TFile, type Vault } from "obsidian";
import { mainNotePathOf } from "../campaign/campaign-folders";
import { shownBackgroundIn, type ShownBackground } from "../campaign/shown-background";
import { paintTabPicture } from "./tab-picture";

export interface TabCampaign {
  readonly campaignFolder: string | null;
  subscribe(listener: () => void): () => void;
}

export type TabMetadata = Pick<MetadataCache, "getCache" | "getFirstLinkpathDest" | "on" | "offref">;
export type TabVault = Pick<Vault, "getResourcePath" | "on" | "offref">;

export class TabBackground extends Component {
  constructor(
    private readonly frameEl: HTMLElement,
    private readonly campaign: TabCampaign,
    private readonly metadata: TabMetadata,
    private readonly vault: TabVault,
  ) {
    super();
  }

  override onload(): void {
    this.register(this.campaign.subscribe(() => this.paint()));
    this.watchMainNote();
    this.watchVault(this.vault.on("create", () => this.paint()));
    this.watchVault(this.vault.on("rename", () => this.paint()));
    this.watchVault(this.vault.on("delete", () => this.paint()));
    this.register(() => paintTabPicture(this.frameEl, null));
    this.paint();
  }

  private watchMainNote(): void {
    const ref = this.metadata.on("changed", (file: TFile) => this.noteChanged(file.path));
    this.register(() => this.metadata.offref(ref));
  }

  private watchVault(ref: EventRef): void {
    this.register(() => this.vault.offref(ref));
  }

  private noteChanged(path: string): void {
    const folder = this.campaign.campaignFolder;
    if (folder === null || path !== mainNotePathOf(folder)) return;
    this.paint();
  }

  private paint(): void {
    paintTabPicture(this.frameEl, this.shown());
  }

  private shown(): ShownBackground | null {
    const folder = this.campaign.campaignFolder;
    if (folder === null) return null;
    return shownBackgroundIn(folder, this.metadata, (picture) => this.vault.getResourcePath(picture));
  }
}
