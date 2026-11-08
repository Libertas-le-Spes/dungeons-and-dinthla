import type { TFile, Vault } from "obsidian";
import type { QuestionRecord, SourcedText } from "../campaign/campaign";
import { appendLines, removeLines, type LineToRemove } from "../notes/note-lines";
import { answerLine, followUpQuestionLine, isFollowUpLine, isQuestionLine, oneLine } from "../notes/question-lines";

export type WriterVault = Pick<Vault, "getFileByPath" | "process" | "read">;

export interface QuestionEdit {
  answer: string;
  followUp: string;
}

export const CHANGED_IN_NOTE = "The question was changed in its note since it was opened, so nothing was written.";

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

function followUpTextOf(followUp: string): string {
  return oneLine(followUp).replace(/^\?\s*/, "");
}

function linesToAdd(question: QuestionRecord, answer: string, answerChanged: boolean, followUp: string): string[] {
  const added: string[] = [];
  if (answer !== "" && answerChanged) added.push(answerLine(question.text, answer));
  if (followUp !== "") added.push(followUpQuestionLine(followUp, question.text));
  return added;
}

export class QuestionWriter {
  constructor(private readonly vault: WriterVault) {}

  async save(question: QuestionRecord, edit: QuestionEdit, sessionPath: string): Promise<void> {
    const answer = oneLine(edit.answer);
    const answerChanged = question.answer === null || answer !== oneLine(question.answer.text);
    const added = linesToAdd(question, answer, answerChanged, followUpTextOf(edit.followUp));
    const target = this.fileAt(sessionPath);
    if (question.answer === null || !answerChanged) {
      if (added.length > 0) await this.vault.process(target, (text) => appendLines(text, added));
      return;
    }
    const oldAnswer = answerRemoval(question, question.answer);
    if (oldAnswer.path === sessionPath) {
      await this.changeOrRefuse(target, (text) => {
        const removal = removeLines(text, [oldAnswer]);
        if (removal.removed === 0) return null;
        return appendLines(removal.text, added);
      });
      return;
    }
    const oldNote = this.fileAt(oldAnswer.path);
    await this.refuseUnlessFound(oldNote, [oldAnswer]);
    if (added.length > 0) await this.vault.process(target, (text) => appendLines(text, added));
    await this.removeOrRefuse(oldNote, [oldAnswer]);
  }

  async reopen(question: QuestionRecord): Promise<void> {
    if (question.answer === null) return;
    const removal = answerRemoval(question, question.answer);
    await this.removeOrRefuse(this.fileAt(removal.path), [removal]);
  }

  async delete(question: QuestionRecord): Promise<void> {
    const removals = [questionRemoval(question), ...question.clues.map((clue) => clueRemoval(question, clue))];
    if (question.answer !== null) removals.push(answerRemoval(question, question.answer));
    const byNote = new Map<string, Removal[]>();
    for (const removal of removals) {
      const group = byNote.get(removal.path);
      if (group === undefined) byNote.set(removal.path, [removal]);
      else group.push(removal);
    }
    const notes = [...byNote].map(([path, group]) => ({ file: this.fileAt(path), group }));
    await this.refuseUnlessFound(notes[0]!.file, notes[0]!.group.slice(0, 1));
    for (const { file, group } of notes) {
      await this.vault.process(file, (text) => removeLines(text, group).text);
    }
  }

  private async refuseUnlessFound(file: TFile, removals: Removal[]): Promise<void> {
    const text = await this.vault.read(file);
    if (removeLines(text, removals).removed < removals.length) throw new Error(CHANGED_IN_NOTE);
  }

  private async removeOrRefuse(file: TFile, removals: Removal[]): Promise<void> {
    await this.changeOrRefuse(file, (text) => {
      const removal = removeLines(text, removals);
      if (removal.removed < removals.length) return null;
      return removal.text;
    });
  }

  private async changeOrRefuse(file: TFile, change: (text: string) => string | null): Promise<void> {
    let refused = false;
    await this.vault.process(file, (text) => {
      const changed = change(text);
      if (changed !== null) return changed;
      refused = true;
      return text;
    });
    if (refused) throw new Error(CHANGED_IN_NOTE);
  }

  private fileAt(path: string): TFile {
    const file = this.vault.getFileByPath(path);
    if (file === null) throw new Error(`${path} was moved or deleted`);
    return file;
  }
}
