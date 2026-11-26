import { campaignFolderOf, findCampaignFolders, startingCampaignFolder } from "../campaign/paths/campaign-folders";
import type { CampaignStore } from "../campaign/reading/campaign-store";
import type { HostNotes } from "../host/host";
import type { Stop } from "../host/notes/note-changes";
import type { NoteRef } from "../host/notes/note-ref";
import type { Telling } from "../host/showing/telling";
import { lookAgain } from "../interface/view/look-again";
import { messageOf } from "../views/dialogs/message-of";
import type { SavedSettings } from "./saved-settings";

export interface FollowingNeeds {
  readonly notes: Pick<HostNotes, "store" | "changes">;
  readonly store: CampaignStore;
  readonly saved: SavedSettings;
  readonly telling: Pick<Telling, "say">;
  activePath(): string | null;
  showBackgrounds(): void;
  showCampaignTabsAgain(): void;
}

function pathOf(note: NoteRef): string {
  return note.path;
}

export class CampaignFollowing {
  private readonly stops: Stop[] = [];

  constructor(private readonly needs: FollowingNeeds) {}

  campaignFolders(): string[] {
    return findCampaignFolders(this.needs.notes.store.files().map(pathOf), this.needs.saved.campaignsFolder.path);
  }

  startingCampaignFolder(): string | null {
    return startingCampaignFolder(this.needs.activePath(), this.needs.saved.chosen.folder, this.campaignFolders());
  }

  async start(): Promise<void> {
    const { changes } = this.needs.notes;
    this.stops.push(
      changes.onRead(this.noteRead.bind(this)),
      changes.onGone(this.noteGone.bind(this)),
      changes.onMoved(this.noteMoved.bind(this)),
      changes.onFolderMoved(this.moved.bind(this)),
    );
    const folder = this.startingCampaignFolder();
    if (folder !== null) await this.needs.saved.chosen.choose(folder);
  }

  stop(): void {
    for (const stop of this.stops) stop();
    this.stops.length = 0;
  }

  async followCampaignOf(path: string): Promise<void> {
    const folder = campaignFolderOf(path, this.campaignFolders());
    if (folder === null || folder === this.needs.store.campaignFolder) return;
    await this.needs.saved.chosen.choose(folder);
  }

  async lookAgain(): Promise<void> {
    await lookAgain({
      startingCampaignFolder: this.startingCampaignFolder.bind(this),
      closeCampaign: this.needs.store.close.bind(this.needs.store),
      chooseCampaign: this.chooseCampaign.bind(this),
      showBackgrounds: this.needs.showBackgrounds,
      showCampaignTabsAgain: this.needs.showCampaignTabsAgain,
    });
  }

  private chooseCampaign(folder: string): Promise<void> {
    return this.needs.saved.chosen.choose(folder);
  }

  private noteRead(note: NoteRef, text: string): void {
    this.needs.store.noteChanged(note.path, text);
  }

  private noteGone(path: string): void {
    this.needs.store.noteDeleted(path);
  }

  private noteMoved(note: NoteRef, oldPath: string): void {
    this.moved(note.path, oldPath);
  }

  private moved(path: string, oldPath: string): void {
    void this.needs.store.noteRenamed(path, oldPath);
    this.needs.saved.chosen.renamed(path, oldPath).catch(this.chosenNotKept.bind(this));
  }

  private chosenNotKept(error: unknown): void {
    this.needs.telling.say(`Couldn't keep the chosen campaign: ${messageOf(error)}`);
  }
}
