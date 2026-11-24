import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteEdit, NoteStore } from "../../host/notes/note-store";
import type { HandedNotes } from "./handed-notes";
import type { WriteReport } from "./write-report";

export class FencedStore implements NoteStore {
  constructor(
    private readonly raw: NoteStore,
    private readonly handed: HandedNotes,
    private readonly report: WriteReport,
  ) {}

  note(path: string): NoteRef | null {
    if (!this.handed.holds(path)) return null;
    return this.handed.hand(this.raw.note(path));
  }

  notes(): NoteRef[] {
    return this.handed.handAll(this.raw.notes());
  }

  files(): NoteRef[] {
    return this.handed.handAll(this.raw.files());
  }

  notesUnder(folder: string): NoteRef[] {
    if (!this.handed.holds(folder)) return [];
    return this.handed.handAll(this.raw.notesUnder(folder));
  }

  hasFolder(path: string): boolean {
    if (!this.handed.holds(path)) return false;
    return this.raw.hasFolder(path);
  }

  namesIn(folder: string): string[] {
    if (!this.handed.holds(folder)) return [];
    return this.raw.namesIn(folder);
  }

  read(note: NoteRef): Promise<string> {
    return this.raw.read(this.handed.held(note));
  }

  readKept(note: NoteRef): Promise<string> {
    return this.raw.readKept(this.handed.held(note));
  }

  async change(note: NoteRef, edit: NoteEdit): Promise<string> {
    const held = this.handed.held(note);
    const text = await this.raw.change(held, edit);
    this.report.textSaved(held.path, text);
    return text;
  }

  async make(path: string, text: string): Promise<NoteRef> {
    const made = await this.raw.make(this.handed.insideNewPath(path), text);
    const handed = this.handed.hand(made);
    if (handed === null) throw new Error(`Couldn't use ${path}: the note was made outside the Campaigns folder.`);
    return handed;
  }

  makeFolder(path: string): Promise<void> {
    return this.raw.makeFolder(this.handed.insideNewPath(path));
  }

  removeEmptyFolder(path: string): Promise<void> {
    return this.raw.removeEmptyFolder(this.handed.insidePath(path));
  }

  async move(note: NoteRef, newPath: string): Promise<void> {
    const held = this.handed.held(note);
    const from = held.path;
    await this.raw.move(held, this.handed.insideNewPath(newPath));
    this.report.renamed(from, newPath);
  }

  changedAt(note: NoteRef): number {
    return this.raw.changedAt(this.handed.held(note));
  }
}
