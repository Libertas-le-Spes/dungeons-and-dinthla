import type { QuestRecord } from "../campaign/record/campaign";
import { NoteEditor, type EditorFiles } from "../campaign/writing/note-editor";
import { questThreadKind } from "../campaign/threads/quest-thread-kind";
import { followUpRemovals, openingRemoval } from "../campaign/threads/thread-removal";

export class QuestWriter {
  private readonly editor: NoteEditor;

  constructor(files: EditorFiles) {
    this.editor = new NoteEditor(files);
  }

  async delete(record: QuestRecord): Promise<boolean> {
    return this.editor.removeWithItsLines(openingRemoval(questThreadKind, record), followUpRemovals(questThreadKind, record));
  }
}
