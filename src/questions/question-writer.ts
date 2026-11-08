import type { QuestionRecord, SourcedText } from "../campaign/campaign";
import { NoteEditor, type EditorVault, type Removal } from "../campaign/note-editor";
import { answerLine, followUpQuestionLine, isFollowUpLine, isQuestionLine, oneLine, questionLine, questionTextOf } from "../notes/question-lines";

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

function linesToAdd(question: QuestionRecord, answer: string, answerChanged: boolean, followUp: string): string[] {
  const added: string[] = [];
  if (answer !== "" && answerChanged) added.push(answerLine(question.text, answer));
  if (followUp !== "") added.push(followUpQuestionLine(followUp, question.text));
  return added;
}

export class QuestionWriter {
  private readonly editor: NoteEditor;

  constructor(vault: EditorVault) {
    this.editor = new NoteEditor(vault);
  }

  async save(question: QuestionRecord, edit: QuestionEdit, sessionPath: string): Promise<boolean> {
    const answer = oneLine(edit.answer);
    const answerChanged = question.answer === null || answer !== oneLine(question.answer.text);
    const added = linesToAdd(question, answer, answerChanged, questionTextOf(edit.followUp));
    if (question.answer === null || !answerChanged) return this.editor.append(sessionPath, added);
    return this.editor.replace(sessionPath, added, answerRemoval(question, question.answer));
  }

  async add(question: string, answer: string, sessionPath: string): Promise<boolean> {
    if (question === "") return false;
    const added = [questionLine(question)];
    const written = oneLine(answer);
    if (written !== "") added.push(answerLine(question, written));
    return this.editor.append(sessionPath, added);
  }

  async reopen(question: QuestionRecord): Promise<boolean> {
    if (question.answer === null) return false;
    return this.editor.remove(answerRemoval(question, question.answer));
  }

  async delete(question: QuestionRecord): Promise<boolean> {
    const others = question.clues.map((clue) => clueRemoval(question, clue));
    if (question.answer !== null) others.push(answerRemoval(question, question.answer));
    return this.editor.removeWithItsLines(questionRemoval(question), others);
  }
}
