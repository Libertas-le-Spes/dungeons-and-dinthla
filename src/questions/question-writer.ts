import type { QuestionRecord } from "../campaign/record/campaign";
import { NoteEditor, type EditorFiles } from "../campaign/writing/note-editor";
import { questionThreadKind } from "../campaign/threads/question-thread-kind";
import { followUpRemovals, openingRemoval } from "../campaign/threads/thread-removal";

export class QuestionWriter {
  private readonly editor: NoteEditor;

  constructor(files: EditorFiles) {
    this.editor = new NoteEditor(files);
  }

  async delete(question: QuestionRecord): Promise<boolean> {
    return this.editor.removeWithItsLines(openingRemoval(questionThreadKind, question), followUpRemovals(questionThreadKind, question));
  }
}
