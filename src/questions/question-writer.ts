import type { TFile, Vault } from "obsidian";
import type { QuestionRecord, SourcedText } from "../campaign/campaign";
import { appendLines, removeLines, type LineToRemove } from "../notes/note-lines";
import { answerLine, followUpQuestionLine, followUpTextOf, isFollowUpLine, isQuestionLine, oneLine } from "../notes/question-lines";

export type WriterVault = Pick<Vault, "getFileByPath" | "process" | "read">;

export interface QuestionEdit {
  answer: string;
  followUp: string;
}

export const CHANGED_IN_NOTE = "The question was changed in its note since it was opened, so nothing was written.";
export const OLD_ANSWER_LEFT =
  "The new answer was written, but the old one had changed in its note since, so it was left. Remove one of them by hand.";

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

export class QuestionWriter {
  constructor(private readonly vault: WriterVault) {}

  async save(question: QuestionRecord, edit: QuestionEdit, sessionPath: string): Promise<boolean> {
    const answer = oneLine(edit.answer);
    const answerChanged = question.answer === null || answer !== oneLine(question.answer.text);
    const added = linesToAdd(question, answer, answerChanged, followUpTextOf(edit.followUp));
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
    if (added.length > 0) await this.vault.process(target, (text) => appendLines(text, added));
    await this.removeOrRefuse(oldNote, [oldAnswer], OLD_ANSWER_LEFT);
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
    const byNote = new Map<string, Removal[]>([[asked.path, []]]);
    for (const removal of others) {
      const group = byNote.get(removal.path);
      if (group === undefined) byNote.set(removal.path, [removal]);
      else group.push(removal);
    }
    const notes = [...byNote].map(([path, group]) => ({ path, file: this.fileAt(path), group }));
    for (const { path, file, group } of notes) {
      if (path !== asked.path) continue;
      await this.changeOrRefuse(file, CHANGED_IN_NOTE, (text) => {
        const withoutQuestion = removeLines(text, [asked]);
        if (withoutQuestion.removed === 0) return null;
        return removeLines(withoutQuestion.text, group).text;
      });
    }
    for (const { path, file, group } of notes) {
      if (path !== asked.path) await this.vault.process(file, (text) => removeLines(text, group).text);
    }
    return true;
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
