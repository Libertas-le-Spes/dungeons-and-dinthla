import { messageOf } from "../../views/dialogs/message-of";
import { NoteEditor, PartlyWritten, WOULD_BE_HIDDEN, type EditorFiles, type Removal } from "../writing/note-editor";
import type { AddedLines, LaterLines, LinesChange, SessionChange } from "./session-change";
import type { PropertiesSyntax } from "../paths/session-file";

export const LATER_NOTE_HIDDEN =
  "The first lines were written, but the later note has a block that never closes, so the rest was left out. Close the block in the note and add the rest by hand.";

export class SessionChangeWriter {
  private readonly editor: NoteEditor;

  constructor(files: EditorFiles, syntax: PropertiesSyntax) {
    this.editor = new NoteEditor(files, syntax);
  }

  async apply(change: SessionChange): Promise<boolean> {
    if ("rewrite" in change) return this.editor.rewrite(change.rewrite.old, change.rewrite.line);
    return this.writeLines(change);
  }

  private async writeLines(change: LinesChange): Promise<boolean> {
    if (change.added === null) return this.removeAlone(change.removal);
    if (change.added.later === null) return this.addWithRemoval(change.added, change.removal);
    return this.addInTwoNotes(change.added, change.removal, change.added.later);
  }

  private async removeAlone(removal: Removal | null): Promise<boolean> {
    if (removal === null) return false;
    return this.editor.drop(removal);
  }

  private async addWithRemoval(added: AddedLines, removal: Removal | null): Promise<boolean> {
    if (removal === null) return this.editor.appendShown(added.path, added.lines);
    return this.editor.replace(added.path, added.lines, removal);
  }

  private async addInTwoNotes(added: AddedLines, removal: Removal | null, later: LaterLines): Promise<boolean> {
    this.editor.ensureExists([added.path, later.path]);
    const wrote = await this.addWithRemoval(added, removal);
    try {
      const wroteLater = await this.editor.appendShown(later.path, later.lines);
      if (wroteLater) return true;
      return wrote;
    } catch (error) {
      if (!wrote) throw error;
      if (messageOf(error) === WOULD_BE_HIDDEN) throw new PartlyWritten(LATER_NOTE_HIDDEN);
      throw new PartlyWritten(`${later.partlyWritten} ${messageOf(error)}`);
    }
  }
}
