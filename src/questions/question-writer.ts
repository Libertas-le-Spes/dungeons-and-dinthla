import type { QuestionRecord } from "../campaign/campaign";
import { NoteEditor, type EditorFiles } from "../campaign/note-editor";
import { questionThreadKind } from "../campaign/question-thread-kind";
import { linesAddedTo } from "../campaign/session-change";
import { SessionChangeWriter } from "../campaign/session-change-writer";
import { followUpRemovals, openingRemoval } from "../campaign/thread-removal";
import { oneLine } from "../notes/one-line";
import { answerLine, questionLine } from "../notes/question-lines";
import type { QuestionPlan } from "./question-plan";
import { questionSessionChange } from "./question-session-change";

export class QuestionWriter {
  private readonly editor: NoteEditor;
  private readonly changes: SessionChangeWriter;

  constructor(files: EditorFiles) {
    this.editor = new NoteEditor(files);
    this.changes = new SessionChangeWriter(files);
  }

  async apply(plan: QuestionPlan): Promise<boolean> {
    return this.changes.apply(questionSessionChange(plan));
  }

  async add(question: string, answer: string, sessionPath: string): Promise<boolean> {
    if (question === "") return false;
    const added = [questionLine(question)];
    const written = oneLine(answer);
    if (written !== "") added.push(answerLine(question, written));
    return this.changes.apply(linesAddedTo(sessionPath, added));
  }

  async delete(question: QuestionRecord): Promise<boolean> {
    return this.editor.removeWithItsLines(openingRemoval(questionThreadKind, question), followUpRemovals(questionThreadKind, question));
  }
}
