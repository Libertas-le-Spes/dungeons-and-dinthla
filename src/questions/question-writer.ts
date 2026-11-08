import type { QuestionRecord, SourcedText } from "../campaign/campaign";
import { NoteEditor, type EditorVault, type Removal } from "../campaign/note-editor";
import { answerLine, isFollowUpLine, isQuestionLine, oneLine, questionLine } from "../notes/question-lines";
import type { QuestionPlan } from "./question-plan";

export interface QuestionEdit {
  answer: string;
  followUp: string;
}

function answerRemoval(question: QuestionRecord, answer: SourcedText): Removal {
  return {
    path: answer.source.path,
    line: answer.source.line,
    matches: (written) => isFollowUpLine(written, "answer", question.text, answer.text),
  };
}

function clueRemoval(question: QuestionRecord, clue: SourcedText): Removal {
  return {
    path: clue.source.path,
    line: clue.source.line,
    matches: (written) => isFollowUpLine(written, "clue", question.text, clue.text),
  };
}

function questionRemoval(question: QuestionRecord): Removal {
  return { path: question.source.path, line: question.source.line, matches: (written) => isQuestionLine(written, question.text) };
}

export class QuestionWriter {
  private readonly editor: NoteEditor;

  constructor(vault: EditorVault) {
    this.editor = new NoteEditor(vault);
  }

  async apply(plan: QuestionPlan): Promise<boolean> {
    if (plan.removal === null) return this.editor.append(plan.targetPath, plan.added);
    return this.editor.replace(plan.targetPath, plan.added, plan.removal);
  }

  async add(question: string, answer: string, sessionPath: string): Promise<boolean> {
    if (question === "") return false;
    const added = [questionLine(question)];
    const written = oneLine(answer);
    if (written !== "") added.push(answerLine(question, written));
    return this.editor.append(sessionPath, added);
  }

  async delete(question: QuestionRecord): Promise<boolean> {
    const others = question.clues.map((clue) => clueRemoval(question, clue));
    if (question.answer !== null) others.push(answerRemoval(question, question.answer));
    return this.editor.removeWithItsLines(questionRemoval(question), others);
  }
}
