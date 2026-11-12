import type { Campaign, SessionNote } from "../campaign/record/campaign";
import { sessionNumberOf } from "../campaign/paths/session-file";
import type { FencedFiles } from "../fence/gate/fenced-files";
import type { WrittenNote, WrittenNotes } from "../fence/gate/written-notes";
import type { DifferingNotes } from "./differing-notes";
import type { ItemNotesPart } from "./item-notes-part";
import type { KindNoteKeeper } from "./kind-note-keeper";
import type { SavesHere } from "./saves-here";
import type { WantedNote } from "./wanted-note";
import { wantedNotesFor } from "./wanted-notes";

export interface WatchedCampaign {
  readonly current: Campaign;
  readonly sessionNotes: SessionNote[];
  readonly campaignFolder: string | null;
  onNoteRead(listener: (path: string, text: string) => void): () => void;
}

export interface KindNoteWatcherNeeds {
  store: WatchedCampaign;
  files: Pick<FencedFiles, "getFileByPath">;
  written: Pick<WrittenNotes, "listen">;
  keeper: Pick<KindNoteKeeper, "keep" | "noteRead">;
  differing: Pick<DifferingNotes, "check" | "forget">;
  saves: SavesHere;
  items: Pick<ItemNotesPart, "sessionSaved">;
}

export class KindNoteWatcher {
  constructor(private readonly needs: KindNoteWatcherNeeds) {}

  start(): () => void {
    const stopWritten = this.needs.written.listen((written) => this.written(written));
    const stopRead = this.needs.store.onNoteRead((path, text) => this.read(path, text));
    return () => {
      stopWritten();
      stopRead();
    };
  }

  checkAll(): void {
    for (const session of this.needs.store.sessionNotes) this.needs.differing.check(this.wantedFor(session.path));
  }

  private written(written: WrittenNote): void {
    if (!this.isSession(written.path)) return;
    if (written.change === "changed" && written.text !== null) this.needs.saves.saved(written.path, written.text);
    if (written.change === "trashed") this.sessionGone(written.path);
  }

  private read(path: string, text: string): void {
    this.needs.keeper.noteRead(path);
    if (!this.isSession(path)) return;
    const wanted = this.wantedFor(path);
    if (this.needs.saves.takeIfSavedHere(path, text)) {
      this.needs.differing.forget(wanted);
      this.needs.keeper.keep(wanted);
      this.needs.items.sessionSaved();
      return;
    }
    this.needs.differing.check(wanted);
  }

  private sessionGone(path: string): void {
    this.needs.saves.forget(path);
    const wanted = wantedNotesFor(this.folderOf(), this.needs.store.current, { path, file: null, note: null });
    this.needs.differing.forget(wanted);
    this.needs.keeper.keep(wanted);
    this.needs.items.sessionSaved();
  }

  private isSession(path: string): boolean {
    const folder = this.needs.store.campaignFolder;
    if (folder === null) return false;
    return sessionNumberOf(path, folder) !== null;
  }

  private wantedFor(path: string): WantedNote[] {
    const { store, files } = this.needs;
    const note = store.sessionNotes.find((session) => session.path === path);
    return wantedNotesFor(this.folderOf(), store.current, { path, file: files.getFileByPath(path), note: this.heldNote(note) });
  }

  private heldNote(note: SessionNote | undefined): SessionNote | null {
    if (note === undefined) return null;
    return note;
  }

  private folderOf(): string {
    const folder = this.needs.store.campaignFolder;
    if (folder === null) throw new Error("No campaign is open.");
    return folder;
  }
}
