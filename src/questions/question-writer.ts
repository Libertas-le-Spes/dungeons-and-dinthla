import type { TFile, Vault } from "obsidian";
import type { QuestionRecord, SourcedText } from "../campaign/campaign";
import { appendLines, removeLines, type LineToRemove } from "../notes/note-lines";
import { answerLine, followUpQuestionLine, isFollowUpLine, isQuestionLine, oneLine } from "../notes/question-lines";

export type WriterVault = Pick<Vault, "getFileByPath" | "process">;

export interface QuestionEdit {
  answer: string;
  followUp: string;
}

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

export class QuestionWriter {
  constructor(private readonly vault: WriterVault) {}

  async save(question: QuestionRecord, edit: QuestionEdit, sessionPath: string): Promise<void> {
    const answer = oneLine(edit.answer);
    const followUp = oneLine(edit.followUp);
    const answerChanged = question.answer === null || answer !== oneLine(question.answer.text);
    if (question.answer !== null && answerChanged) await this.remove([answerRemoval(question, question.answer)]);
    const added: string[] = [];
    if (answer !== "" && answerChanged) added.push(answerLine(question.text, answer));
    if (followUp !== "") added.push(followUpQuestionLine(followUp, question.text));
    if (added.length > 0) await this.vault.process(this.fileAt(sessionPath), (text) => appendLines(text, added));
  }

  async reopen(question: QuestionRecord): Promise<void> {
    if (question.answer === null) return;
    await this.remove([answerRemoval(question, question.answer)]);
  }

  async delete(question: QuestionRecord): Promise<void> {
    const removals: Removal[] = [
      { path: question.source.path, line: question.source.line, matches: (written) => isQuestionLine(written, question.text) },
      ...question.clues.map((clue) => clueRemoval(question, clue)),
    ];
    if (question.answer !== null) removals.push(answerRemoval(question, question.answer));
    await this.remove(removals);
  }

  private async remove(removals: Removal[]): Promise<void> {
    const byPath = new Map<string, Removal[]>();
    for (const removal of removals) {
      const group = byPath.get(removal.path);
      if (group === undefined) byPath.set(removal.path, [removal]);
      else group.push(removal);
    }
    for (const [path, group] of byPath) {
      await this.vault.process(this.fileAt(path), (text) => removeLines(text, group).text);
    }
  }

  private fileAt(path: string): TFile {
    const file = this.vault.getFileByPath(path);
    if (file === null) throw new Error(`${path} was moved or deleted`);
    return file;
  }
}
