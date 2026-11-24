import type { Campaign, SessionNote } from "../record/campaign";
import { CampaignStore, type CampaignListener } from "./campaign-store";
import type { CampaignFiles } from "./read-campaign";
import type { NoteChanges, Stop } from "../../host/notes/note-changes";
import type { NoteRef } from "../../host/notes/note-ref";

export type ShownCampaign = Pick<CampaignStore, "campaignFolder" | "subscribe">;

export interface SavedCampaignNotes {
  readonly store: CampaignFiles;
  readonly changes: Pick<NoteChanges, "onRead" | "onGone" | "onMoved" | "onFolderMoved">;
}

export interface SavedCampaignNeeds {
  shown: ShownCampaign;
  notes: SavedCampaignNotes;
  failed(error: unknown): void;
}

export type NoteRead = (path: string, text: string) => void;

export type CampaignOpened = (folder: string) => void;

export class SavedCampaign {
  private readonly saved: CampaignStore;
  private readonly readListeners = new Set<NoteRead>();
  private readonly openedListeners = new Set<CampaignOpened>();

  constructor(private readonly needs: SavedCampaignNeeds) {
    this.saved = new CampaignStore(needs.notes.store);
  }

  get current(): Campaign {
    return this.saved.current;
  }

  get campaignFolder(): string | null {
    return this.saved.campaignFolder;
  }

  get opening(): boolean {
    return this.saved.opening;
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
    const { changes } = this.needs.notes;
    const stops: Stop[] = [
      changes.onRead(this.noteRead.bind(this)),
      changes.onGone(this.saved.noteDeleted.bind(this.saved)),
      changes.onMoved(this.noteMoved.bind(this)),
      changes.onFolderMoved(this.moved.bind(this)),
      this.needs.shown.subscribe(this.followShown.bind(this)),
    ];
    this.followShown();
    return this.stopAll.bind(this, stops);
  }

  private stopAll(stops: Stop[]): void {
    for (const stop of stops) stop();
    this.saved.close();
  }

  private noteMoved(note: NoteRef, oldPath: string): void {
    this.moved(note.path, oldPath);
  }

  private moved(path: string, oldPath: string): void {
    this.saved.noteRenamed(path, oldPath).catch((error: unknown) => this.needs.failed(error));
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

  private noteRead(note: NoteRef, text: string): void {
    this.saved.noteChanged(note.path, text);
    for (const listener of this.readListeners) listener(note.path, text);
  }

  private opened(folder: string): void {
    if (folder !== this.saved.campaignFolder) return;
    for (const listener of this.openedListeners) listener(folder);
  }
}
