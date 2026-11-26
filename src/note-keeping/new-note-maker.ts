import { parentFolderOf } from "../campaign/paths/note-name";
import type { ChangeProperties, NoteKeeping } from "../host/notes/note-keeping";
import type { NoteRef } from "../host/notes/note-ref";
import type { NoteStore } from "../host/notes/note-store";
import type { NoteSyntax } from "../host/rules/note-syntax";
import { hasNoWords, holdsOnlyPluginPropertiesIn } from "./note-words";
import { PropertyWriter } from "./property-writer";

export type MakerStore = Pick<NoteStore, "hasFolder" | "makeFolder" | "make" | "read">;
export type MakerKeeping = Pick<NoteKeeping, "changeProperties" | "throwAway">;

export interface MakerParts {
  readonly store: MakerStore;
  readonly keeping: MakerKeeping;
  readonly syntax: NoteSyntax;
}

export class NewNoteMaker {
  private readonly properties: PropertyWriter;

  constructor(private readonly parts: MakerParts) {
    this.properties = new PropertyWriter(parts.store, parts.keeping, parts.syntax);
  }

  async make(path: string, change: ChangeProperties): Promise<void> {
    const folder = parentFolderOf(path);
    if (!this.parts.store.hasFolder(folder)) await this.parts.store.makeFolder(folder);
    const note = await this.parts.store.make(path, "");
    await this.fill(note, change);
  }

  async fill(note: NoteRef, change: ChangeProperties): Promise<void> {
    try {
      await this.properties.set(note, change);
    } catch (error) {
      await this.discard(note);
      throw error;
    }
  }

  async trashIfNothingOfHis(note: NoteRef): Promise<boolean> {
    const text = await this.parts.store.read(note);
    if (!hasNoWords(text, this.parts.syntax) || !holdsOnlyPluginPropertiesIn(text, this.parts.syntax)) return false;
    await this.parts.keeping.throwAway(note);
    return true;
  }

  private async discard(note: NoteRef): Promise<void> {
    try {
      await this.trashIfNothingOfHis(note);
    } catch {
      return;
    }
  }
}
