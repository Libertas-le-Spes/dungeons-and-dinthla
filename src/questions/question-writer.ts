import type { QuestionRecord, SourcedText } from "../campaign/campaign";
import { NoteEditor, PartlyWritten, type EditorFiles, type Removal } from "../campaign/note-editor";
import { messageOf } from "../views/message-of";
import { answerLine, isQuestionLine, questionLine } from "../notes/question-lines";
import { isFollowUpLine, oneLine } from "../notes/thread-lines";
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

  constructor(files: EditorFiles) {
    this.editor = new NoteEditor(files);
  }

  async apply(plan: QuestionPlan): Promise<boolean> {
    if (plan.answerPath === plan.followUpPath) return this.writeAnswer(plan, [...plan.answerLines, ...plan.followUpLines]);
    this.editor.ensureExists([plan.answerPath, plan.followUpPath]);
    const wrote = await this.writeAnswer(plan, plan.answerLines);
    try {
      const followed = await this.editor.append(plan.followUpPath, plan.followUpLines);
      return wrote || followed;
    } catch (error) {
      if (!wrote) throw error;
      throw new PartlyWritten(`The answer was written, but the follow-up couldn't be: ${messageOf(error)}`);
    }
  }

  private async writeAnswer(plan: QuestionPlan, lines: string[]): Promise<boolean> {
    if (plan.removal === null) return this.editor.append(plan.answerPath, lines);
    return this.editor.replace(plan.answerPath, lines, plan.removal);
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
