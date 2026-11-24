import type { QuestionRecord } from "../../campaign/record/campaign";
import { NoteEditor, type EditorFiles } from "../../campaign/writing/note-editor";
import { questionThreadKind } from "../../campaign/threads/question-thread-kind";
import { followUpRemovals, openingRemoval } from "../../campaign/threads/thread-removal";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

export class QuestionWriter {
  private readonly editor: NoteEditor;

  constructor(files: EditorFiles, syntax: PropertiesSyntax) {
    this.editor = new NoteEditor(files, syntax);
  }

  async delete(question: QuestionRecord): Promise<boolean> {
    return this.editor.removeWithItsLines(openingRemoval(questionThreadKind, question), followUpRemovals(questionThreadKind, question));
  }
}
