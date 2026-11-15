import type { TFile } from "obsidian";
import type { SaidOnce } from "../../note-keeping/said-once";
import { canMake, wantedKeyOf, type WantedNote } from "../wanting/wanted-note";
import { readExistingNote, type ExistingMetadata } from "./existing-note";
import type { HalfMadeNote } from "./half-made-note";
import { notLinkedMessage, staysMessage } from "./keeper-messages";
import type { KindNoteWriter } from "./kind-note-writer";
import type { NoteAttempts } from "./note-attempts";
import type { NoteMemos } from "./note-memos";
import { sessionLinkFor } from "./session-link";

export interface ExistingNoteSettlerParts {
  metadata: ExistingMetadata;
  writer: KindNoteWriter;
  memos: NoteMemos;
  said: SaidOnce;
  attempts: NoteAttempts;
  halfMade: HalfMadeNote;
}

export class ExistingNoteSettler {
  constructor(private readonly parts: ExistingNoteSettlerParts) {}

  async settle(file: TFile, note: WantedNote): Promise<void> {
    const { metadata, writer, memos, said, attempts } = this.parts;
    const halfMade = await this.parts.halfMade.stateOf(file, note);
    if (halfMade === "unreadable" || halfMade === "too new") return;
    if (halfMade === "yes" && canMake(note)) {
      await attempts.attempt(note, () => writer.fill(file, sessionLinkFor(note.sessionFile), note.lines));
      return;
    }
    const existing = readExistingNote(metadata, file, note);
    if (!existing.read) {
      memos.waitForRead(note.path);
      return;
    }
    if (!existing.linked) {
      said.say(`link:${note.path}`, notLinkedMessage(note));
      return;
    }
    if (note.lines.length === 0) {
      await attempts.attempt(note, () => this.removeLines(file, note, !existing.alreadyThere));
      return;
    }
    if (existing.alreadyThere) {
      memos.settle(note.path, wantedKeyOf(note));
      return;
    }
    await attempts.attempt(note, () => writer.setLines(file, note.lines));
  }

  private async removeLines(file: TFile, note: WantedNote, linesToEmpty: boolean): Promise<void> {
    const trashed = await this.parts.writer.trashOrEmpty(file, linesToEmpty);
    if (!trashed && note.sessionFile === null) this.parts.said.say(`stays:${note.path}`, staysMessage(note));
  }
}
