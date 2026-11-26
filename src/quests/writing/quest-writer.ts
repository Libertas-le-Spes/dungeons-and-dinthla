import type { QuestRecord } from "../../campaign/record/campaign";
import { NoteEditor, type EditorFiles } from "../../campaign/writing/note-editor";
import { questThreadKind } from "../../campaign/threads/quest-thread-kind";
import { followUpRemovals, openingRemoval } from "../../campaign/threads/thread-removal";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

export class QuestWriter {
  private readonly editor: NoteEditor;

  constructor(files: EditorFiles, syntax: PropertiesSyntax) {
    this.editor = new NoteEditor(files, syntax);
  }

  async delete(record: QuestRecord): Promise<boolean> {
    return this.editor.removeWithItsLines(openingRemoval(questThreadKind, record), followUpRemovals(questThreadKind, record));
  }
}
