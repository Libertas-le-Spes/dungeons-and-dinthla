import type { QuestionRecord, SourcedText } from "../campaign/campaign";
import { NoteEditor, type EditorVault, type Removal } from "../campaign/note-editor";
import { answerLine, isFollowUpLine, isQuestionLine, oneLine, questionLine } from "../notes/question-lines";
import { answerRemoval, type QuestionPlan } from "./question-plan";

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
    let wrote = false;
    if (plan.removal === null) wrote = await this.editor.append(plan.answerPath, plan.answerLines);
    else wrote = await this.editor.replace(plan.answerPath, plan.answerLines, plan.removal);
    const followed = await this.editor.append(plan.followUpPath, plan.followUpLines);
    return wrote || followed;
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
    const answer = answerRemoval(question);
    if (answer !== null) others.push(answer);
    return this.editor.removeWithItsLines(questionRemoval(question), others);
  }
}
