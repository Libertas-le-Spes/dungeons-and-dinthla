import type { MakeResult } from "../../note-keeping/make-result";
import { NewNoteMaker, type MakerKeeping, type MakerStore } from "../../note-keeping/new-note-maker";
import type { NoteStore } from "../../host/notes/note-store";
import type { NoteSyntax } from "../../host/rules/note-syntax";
import { nameKeyOf } from "../../names/name-key";
import { sessionLinkFor } from "../../kind-notes/keeping/session-link";
import { firstNamedIn } from "./first-named-property";
import type { PlannedReferenceNote } from "./reference-note-plan";

export interface ReferenceMakerNotes {
  readonly store: MakerStore & Pick<NoteStore, "note">;
  readonly keeping: MakerKeeping;
}

export interface ReferenceNoteMakerNeeds {
  notes: ReferenceMakerNotes;
  syntax: NoteSyntax;
  failed(note: PlannedReferenceNote, error: unknown): void;
}

export class ReferenceNoteMaker {
  private readonly maker: NewNoteMaker;
  private readonly reserved = new Set<string>();

  constructor(private readonly needs: ReferenceNoteMakerNeeds) {
    this.maker = new NewNoteMaker({ store: needs.notes.store, keeping: needs.notes.keeping, syntax: needs.syntax });
  }

  async make(note: PlannedReferenceNote): Promise<MakeResult> {
    return this.makeIfMissing(note);
  }

  private async makeIfMissing(note: PlannedReferenceNote): Promise<MakeResult> {
    const { store } = this.needs.notes;
    const sessionFile = store.note(note.firstSession.path);
    const key = nameKeyOf(note.name);
    if (sessionFile === null || store.note(note.path) !== null || this.reserved.has(key)) return "left";
    this.reserved.add(key);
    try {
      await this.maker.make(note.path, firstNamedIn(sessionLinkFor(sessionFile)));
      return "made";
    } catch (error) {
      this.reserved.delete(key);
      this.needs.failed(note, error);
      return "failed";
    }
  }
}
