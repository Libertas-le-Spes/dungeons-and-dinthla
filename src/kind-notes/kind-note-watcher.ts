import type { SessionNote } from "../campaign/record/campaign";
import type { WrittenNotes } from "../fence/gate/written-notes";
import type { DifferingNotes } from "./differing-notes";
import type { ItemNotesPart } from "./item-notes-part";
import type { KindNoteMover } from "./kind-note-mover";
import type { KindNoteKeeper } from "./kind-note-keeper";
import type { SavesHere } from "./saves-here";
import type { SessionWants, WantedStore } from "./session-wants";

export interface WatchedCampaign extends WantedStore {
  onNoteRead(listener: (path: string, text: string) => void): () => void;
}

export interface KindNoteWatcherNeeds {
  store: Pick<WatchedCampaign, "onNoteRead" | "sessionNotes">;
  wants: SessionWants;
  written: Pick<WrittenNotes, "listen">;
  keeper: Pick<KindNoteKeeper, "keep" | "noteRead">;
  differing: Pick<DifferingNotes, "check" | "checkAll" | "forget">;
  saves: SavesHere;
  items: Pick<ItemNotesPart, "sessionSaved">;
  mover: Pick<KindNoteMover, "sessionRenamed">;
}

function pathOfSession(session: SessionNote): string {
  return session.path;
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
    this.needs.differing.checkAll(this.needs.store.sessionNotes.map(pathOfSession));
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
