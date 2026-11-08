import type { TFile, Vault } from "obsidian";
import type { QuestionRecord, SourcedText } from "../campaign/campaign";
import { appendLines, removeLines, type LineToRemove } from "../notes/note-lines";
import { messageOf } from "../views/message-of";
import { answerLine, followUpQuestionLine, isFollowUpLine, isQuestionLine, oneLine, questionLine, questionTextOf } from "../notes/question-lines";

export type WriterVault = Pick<Vault, "getFileByPath" | "process" | "read">;

export interface QuestionEdit {
  answer: string;
  followUp: string;
}

export const CHANGED_IN_NOTE = "The question was changed in its note since it was opened, so nothing was written.";
export const OLD_ANSWER_LEFT =
  "The new answer was written, but the old one had changed in its note since, so it was left. Remove one of them by hand.";
export const DUPLICATE_LINES = "More than one line in the note reads like this question, so nothing was deleted.";

export class PartlyWritten extends Error {}

interface Removal extends LineToRemove {
  path: string;
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

function countMatches(text: string, removal: Removal): number {
  return text.split("\n").filter((written) => removal.matches(written.replace(/\r$/, ""))).length;
}

export class QuestionWriter {
  constructor(private readonly vault: WriterVault) {}

  async save(question: QuestionRecord, edit: QuestionEdit, sessionPath: string): Promise<boolean> {
    const answer = oneLine(edit.answer);
    const answerChanged = question.answer === null || answer !== oneLine(question.answer.text);
    const added = linesToAdd(question, answer, answerChanged, questionTextOf(edit.followUp));
    const target = this.fileAt(sessionPath);
    if (question.answer === null || !answerChanged) {
      if (added.length === 0) return false;
      await this.vault.process(target, (text) => appendLines(text, added));
      return true;
    }
    const oldAnswer = answerRemoval(question, question.answer);
    if (oldAnswer.path === sessionPath) {
      await this.changeOrRefuse(target, CHANGED_IN_NOTE, (text) => {
        const removal = removeLines(text, [oldAnswer]);
        if (removal.removed === 0) return null;
        return appendLines(removal.text, added);
      });
      return true;
    }
    const oldNote = this.fileAt(oldAnswer.path);
    await this.refuseUnlessFound(oldNote, [oldAnswer]);
    if (added.length === 0) {
      await this.removeOrRefuse(oldNote, [oldAnswer], CHANGED_IN_NOTE);
      return true;
    }
    await this.vault.process(target, (text) => appendLines(text, added));
    try {
      await this.removeOrRefuse(oldNote, [oldAnswer], OLD_ANSWER_LEFT);
    } catch (error) {
      throw new PartlyWritten(messageOf(error));
    }
    return true;
  }

  async add(question: string, answer: string, sessionPath: string): Promise<boolean> {
    if (question === "") return false;
    const added = [questionLine(question)];
    const written = oneLine(answer);
    if (written !== "") added.push(answerLine(question, written));
    await this.vault.process(this.fileAt(sessionPath), (text) => appendLines(text, added));
    return true;
  }

  async reopen(question: QuestionRecord): Promise<boolean> {
    if (question.answer === null) return false;
    const removal = answerRemoval(question, question.answer);
    await this.removeOrRefuse(this.fileAt(removal.path), [removal], CHANGED_IN_NOTE);
    return true;
  }

  async delete(question: QuestionRecord): Promise<boolean> {
    const asked = questionRemoval(question);
    const others = question.clues.map((clue) => clueRemoval(question, clue));
    if (question.answer !== null) others.push(answerRemoval(question, question.answer));
    const inAskedNote = others.filter((removal) => removal.path === asked.path);
    const elsewhere = new Map<string, Removal[]>();
    for (const removal of others.filter((other) => other.path !== asked.path)) {
      const group = elsewhere.get(removal.path);
      if (group === undefined) elsewhere.set(removal.path, [removal]);
      else group.push(removal);
    }
    const askedNote = this.fileAt(asked.path);
    const otherNotes = [...elsewhere].map(([path, group]) => ({ path, file: this.fileAt(path), group }));
    await this.removeQuestionLine(askedNote, asked, inAskedNote);
    for (const { path, file, group } of otherNotes) {
      try {
        await this.vault.process(file, (text) => removeLines(text, group).text);
      } catch (error) {
        throw new PartlyWritten(`The question was deleted, but its lines in ${path} were left: ${messageOf(error)}`);
      }
    }
    return true;
  }

  private async removeQuestionLine(file: TFile, asked: Removal, alongside: Removal[]): Promise<void> {
    let duplicated = false;
    await this.changeOrRefuse(file, CHANGED_IN_NOTE, (text) => {
      if (countMatches(text, asked) > 1) {
        duplicated = true;
        return text;
      }
      const withoutQuestion = removeLines(text, [asked]);
      if (withoutQuestion.removed === 0) return null;
      return removeLines(withoutQuestion.text, alongside).text;
    });
    if (duplicated) throw new Error(DUPLICATE_LINES);
  }

  private async refuseUnlessFound(file: TFile, removals: Removal[]): Promise<void> {
    const text = await this.vault.read(file);
    if (removeLines(text, removals).removed < removals.length) throw new Error(CHANGED_IN_NOTE);
  }

  private async removeOrRefuse(file: TFile, removals: Removal[], message: string): Promise<void> {
    await this.changeOrRefuse(file, message, (text) => {
      const removal = removeLines(text, removals);
      if (removal.removed < removals.length) return null;
      return removal.text;
    });
  }

  private async changeOrRefuse(file: TFile, message: string, change: (text: string) => string | null): Promise<void> {
    let refused = false;
    await this.vault.process(file, (text) => {
      const changed = change(text);
      if (changed !== null) return changed;
      refused = true;
      return text;
    });
    if (refused) throw new Error(message);
  }

  private fileAt(path: string): TFile {
    const file = this.vault.getFileByPath(path);
    if (file === null) throw new Error(`${path} was moved or deleted`);
    return file;
  }
}
