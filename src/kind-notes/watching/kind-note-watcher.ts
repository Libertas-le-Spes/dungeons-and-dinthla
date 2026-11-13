import type { WrittenNotes } from "../../fence/gate/written-notes";
import type { DifferingNotes } from "./differing-notes";
import type { ItemNotesPart } from "./item-notes-part";
import type { KindNoteMover } from "../keeping/kind-note-mover";
import type { KindNoteKeeper } from "../keeping/kind-note-keeper";
import type { SavesHere } from "./saves-here";
import type { SessionWants, WantedStore } from "../wanting/session-wants";

export interface WatchedCampaign extends WantedStore {
  onNoteRead(listener: (path: string, text: string) => void): () => void;
}

export interface KindNoteWatcherNeeds {
  store: Pick<WatchedCampaign, "onNoteRead">;
  wants: SessionWants;
  written: Pick<WrittenNotes, "listen">;
  keeper: Pick<KindNoteKeeper, "keep" | "noteRead">;
  differing: Pick<DifferingNotes, "check" | "checkAll" | "forget">;
  saves: SavesHere;
  items: Pick<ItemNotesPart, "sessionSaved">;
  mover: Pick<KindNoteMover, "sessionRenamed">;
}

export class KindNoteWatcher {
  constructor(private readonly needs: KindNoteWatcherNeeds) {}

  start(): () => void {
    const stopWritten = this.needs.written.listen({
      textSaved: (path, text) => this.textSaved(path, text),
      trashed: (path) => this.sessionGone(path),
      renamed: (from, to) => this.needs.mover.sessionRenamed(from, to),
    });
    const stopRead = this.needs.store.onNoteRead((path, text) => this.read(path, text));
    return () => {
      stopWritten();
      stopRead();
    };
  }

  checkAll(): void {
    this.needs.differing.checkAll(this.needs.wants.sessionPaths());
  }

  private textSaved(path: string, text: string): void {
    if (this.needs.wants.isSession(path)) this.needs.saves.saved(path, text);
  }

  private read(path: string, text: string): void {
    this.needs.keeper.noteRead(path);
    if (!this.needs.wants.isSession(path)) return;
    const savedHere = this.needs.saves.takeIfSavedHere(path, text);
    if (this.needs.wants.opening) return;
    if (!savedHere) {
      this.needs.differing.check(path);
      return;
    }
    this.needs.differing.forget(path);
    this.needs.keeper.keep(this.needs.wants.notesFor(path));
    this.needs.items.sessionSaved();
  }

  private sessionGone(path: string): void {
    if (!this.needs.wants.isSession(path)) return;
    this.needs.saves.forget(path);
    this.needs.differing.forget(path);
    this.needs.keeper.keep(this.needs.wants.notesOfGoneSession(path));
    if (!this.needs.wants.opening) this.needs.items.sessionSaved();
  }
}
