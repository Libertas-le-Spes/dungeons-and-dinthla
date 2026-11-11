import type { QuestRecord } from "../campaign/campaign";
import { NoteEditor, type EditorFiles } from "../campaign/note-editor";
import { questThreadKind } from "../campaign/quest-thread-kind";
import { followUpRemovals, openingRemoval } from "../campaign/thread-removal";

export class QuestWriter {
  private readonly editor: NoteEditor;

  constructor(files: EditorFiles) {
    this.editor = new NoteEditor(files);
  }

  async delete(record: QuestRecord): Promise<boolean> {
    return this.editor.removeWithItsLines(openingRemoval(questThreadKind, record), followUpRemovals(questThreadKind, record));
  }
}
