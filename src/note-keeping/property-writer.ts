import type { ChangeProperties, NoteKeeping } from "../host/notes/note-keeping";
import type { NoteRef } from "../host/notes/note-ref";
import type { NoteStore } from "../host/notes/note-store";
import type { NoteSyntax } from "../host/rules/note-syntax";
import { wordsOf } from "./note-words";

export type PropertyStore = Pick<NoteStore, "read">;
export type PropertyKeeping = Pick<NoteKeeping, "changeProperties">;

export const WORDS_CHANGED = "its own words changed while its properties were written, so the note was left as it is now. Look at it.";

export class PropertyWriter {
  constructor(
    private readonly store: PropertyStore,
    private readonly keeping: PropertyKeeping,
    private readonly syntax: NoteSyntax,
  ) {}

  async set(note: NoteRef, change: ChangeProperties): Promise<void> {
    const before = await this.store.read(note);
    await this.keeping.changeProperties(note, change);
    const after = await this.store.read(note);
    if (wordsOf(after, this.syntax) !== wordsOf(before, this.syntax)) throw new Error(WORDS_CHANGED);
  }
}
