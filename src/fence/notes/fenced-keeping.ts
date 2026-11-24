import type { NoteRef } from "../../host/notes/note-ref";
import type { ChangeProperties, NoteKeeping } from "../../host/notes/note-keeping";
import type { HandedNotes } from "./handed-notes";
import type { WriteReport } from "./write-report";

export class FencedKeeping implements NoteKeeping {
  constructor(
    private readonly raw: NoteKeeping,
    private readonly handed: HandedNotes,
    private readonly report: WriteReport,
  ) {}

  async moveWithLinks(note: NoteRef, newPath: string): Promise<void> {
    const held = this.handed.held(note);
    const from = held.path;
    await this.raw.moveWithLinks(held, this.handed.insideNewPath(newPath));
    this.report.renamed(from, newPath);
  }

  async throwAway(note: NoteRef): Promise<void> {
    const held = this.handed.held(note);
    const path = held.path;
    await this.raw.throwAway(held);
    this.report.trashed(path);
  }

  throwsAwayForGood(): boolean {
    return this.raw.throwsAwayForGood();
  }

  changeProperties(note: NoteRef, change: ChangeProperties): Promise<void> {
    return this.raw.changeProperties(this.handed.held(note), change);
  }
}
