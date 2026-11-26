import type { Fence } from "../../fence/paths/fence";
import type { NoteChanges, Stop } from "../../host/notes/note-changes";
import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteStore } from "../../host/notes/note-store";
import { NoteDrafts } from "../../note-editing/note-drafts";
import type { Drafts } from "../drafts/drafts";
import { setAsideGoneNotes } from "./gone-notes";
import { KeptDrafts } from "./kept-drafts";

export interface DraftKeepingNeeds {
  changes: Pick<NoteChanges, "onMoved" | "onGone">;
  store: Pick<NoteStore, "note">;
  fence: Pick<Fence, "holds">;
  campaignsFolder: () => string | null;
  now: () => number;
}

export class DraftKeeping {
  readonly keptDrafts: KeptDrafts;
  readonly noteDrafts: NoteDrafts;
  private readonly stops: Stop[] = [];

  constructor(
    drafts: Drafts,
    private readonly needs: DraftKeepingNeeds,
  ) {
    this.keptDrafts = new KeptDrafts(drafts, needs.now);
    this.noteDrafts = new NoteDrafts(drafts);
  }

  start(): void {
    this.stops.push(this.needs.changes.onMoved(this.noteMoved.bind(this)), this.needs.changes.onGone(this.noteGone.bind(this)));
  }

  stop(): void {
    for (const stop of this.stops) stop();
    this.stops.length = 0;
  }

  setAsideGoneNotes(): void {
    setAsideGoneNotes(this.keptDrafts, this.needs.campaignsFolder(), this.staysLive.bind(this));
  }

  private noteMoved(note: NoteRef, oldPath: string): void {
    this.keptDrafts.noteRenamed(oldPath, note.path);
    this.noteDrafts.moved(oldPath, note.path);
  }

  private noteGone(path: string): void {
    this.keptDrafts.noteDeleted(path);
  }

  private staysLive(key: string): boolean {
    if (this.noteDrafts.owns(key)) return true;
    if (!this.needs.fence.holds(key)) return true;
    return this.needs.store.note(key) !== null;
  }
}
