import type { Campaign, SessionNote } from "../record/campaign";
import { CampaignStore, type CampaignListener } from "./campaign-store";
import type { CampaignFiles } from "./read-campaign";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import type { FencedMetadata } from "../../fence/gate/fenced-metadata";

export type ShownCampaign = Pick<CampaignStore, "campaignFolder" | "subscribe">;

export interface SavedCampaignNeeds {
  shown: ShownCampaign;
  files: CampaignFiles & Pick<FencedFiles, "on" | "offref">;
  metadata: Pick<FencedMetadata, "on" | "offref">;
  failed(error: unknown): void;
}

export type NoteRead = (path: string, text: string) => void;

export type CampaignOpened = (folder: string) => void;

export class SavedCampaign {
  private readonly saved: CampaignStore;
  private readonly readListeners = new Set<NoteRead>();
  private readonly openedListeners = new Set<CampaignOpened>();

  constructor(private readonly needs: SavedCampaignNeeds) {
    this.saved = new CampaignStore(needs.files);
  }

  get current(): Campaign {
    return this.saved.current;
  }

  get campaignFolder(): string | null {
    return this.saved.campaignFolder;
  }

  get sessionNotes(): SessionNote[] {
    return this.saved.sessionNotes;
  }

  onNoteRead(listener: NoteRead): () => void {
    this.readListeners.add(listener);
    return () => this.readListeners.delete(listener);
  }

  onOpened(listener: CampaignOpened): () => void {
    this.openedListeners.add(listener);
    return () => this.openedListeners.delete(listener);
  }

  subscribe(listener: CampaignListener): () => void {
    return this.saved.subscribe(listener);
  }

  start(): () => void {
    const { files, metadata, shown } = this.needs;
    const changed = metadata.on("changed", (file, text) => this.noteRead(file.path, text));
    const deleted = files.on("delete", (file) => this.saved.noteDeleted(file.path));
    const renamed = files.on("rename", (file, oldPath) => {
      this.saved.noteRenamed(file.path, oldPath).catch((error: unknown) => this.needs.failed(error));
    });
    const stopFollowing = shown.subscribe(() => this.followShown());
    this.followShown();
    return () => {
      stopFollowing();
      metadata.offref(changed);
      files.offref(deleted);
      files.offref(renamed);
      this.saved.close();
    };
  }

  private followShown(): void {
    const folder = this.needs.shown.campaignFolder;
    if (folder === this.saved.campaignFolder) return;
    if (folder === null) {
      this.saved.close();
      return;
    }
    this.saved
      .open(folder)
      .then(() => this.opened(folder))
      .catch((error: unknown) => this.needs.failed(error));
  }

  private noteRead(path: string, text: string): void {
    this.saved.noteChanged(path, text);
    for (const listener of this.readListeners) listener(path, text);
  }

  private opened(folder: string): void {
    if (folder !== this.saved.campaignFolder) return;
    for (const listener of this.openedListeners) listener(folder);
  }
}
