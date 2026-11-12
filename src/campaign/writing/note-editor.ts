import type { TFile } from "obsidian";
import { addedLinesHidden } from "../../notes/reading/hidden-lines";
import { appendLines, dropLine, removeLines, rewriteLine, type LineToRemove } from "../../notes/writing/note-lines";
import { messageOf } from "../../views/dialogs/message-of";
import type { SessionNote, Source } from "../record/campaign";
import { keepsProperties } from "../paths/session-file";
import type { FencedFiles } from "../../fence/gate/fenced-files";

export type EditorFiles = Pick<FencedFiles, "getFileByPath" | "process" | "read">;

export const CHANGED_IN_NOTE = "A line was changed in its note since the dialog was opened, so nothing was written.";
export const OLD_LINE_LEFT =
  "The new line was written, but the old one had changed in its note since, so it was left. Remove one of them by hand.";
export const LINES_LEFT = "It was deleted, but some of its lines had changed or moved since they were read, so they were left in";

export const PROPERTIES_WOULD_CHANGE = "That change would turn lines of the note into its properties, hiding them, because a --- line would come first.";

export const WOULD_BE_HIDDEN =
  "The new line would land inside a code block or comment that never closes, so nothing was written. Close it in the note.";

export class PartlyWritten extends Error {}

interface Refusal {
  refusal: string;
}

function appendedShown(text: string, added: string[]): string | Refusal {
  const changed = appendLines(text, added);
  if (addedLinesHidden(changed, added.length)) return { refusal: WOULD_BE_HIDDEN };
  return changed;
}

export interface Removal extends LineToRemove {
  path: string;
}

export function lineAsRead(sessions: SessionNote[], source: Source): string | undefined {
  const session = sessions.find((candidate) => candidate.path === source.path);
  if (session === undefined) return undefined;
  const read = session.text.split("\n")[source.line];
  if (read === undefined) return undefined;
  return read.replace(/\r$/, "");
}

export function removalAsRead(sessions: SessionNote[], source: Source): Removal {
  const read = lineAsRead(sessions, source);
  return { path: source.path, line: source.line, matches: (line) => line === read };
}

export class NoteEditor {
  constructor(private readonly files: EditorFiles) {}

  async append(targetPath: string, added: string[]): Promise<boolean> {
    if (added.length === 0) return false;
    await this.changeOrRefuse(this.fileAt(targetPath), CHANGED_IN_NOTE, (text) => appendLines(text, added));
    return true;
  }

  async appendShown(targetPath: string, added: string[]): Promise<boolean> {
    if (added.length === 0) return false;
    await this.changeOrRefuse(this.fileAt(targetPath), WOULD_BE_HIDDEN, (text) => appendedShown(text, added));
    return true;
  }

  async replace(targetPath: string, added: string[], old: Removal): Promise<boolean> {
    const target = this.fileAt(targetPath);
    if (old.path === targetPath) {
      await this.changeOrRefuse(target, CHANGED_IN_NOTE, (text) => {
        const removal = removeLines(text, [old]);
        if (removal.removed === 0) return null;
        return appendedShown(removal.text, added);
      });
      return true;
    }
    const oldNote = this.fileAt(old.path);
    if ((await this.checkRemoval(oldNote, [old])) === 0) throw new Error(CHANGED_IN_NOTE);
    if (added.length === 0) {
      await this.removeOrRefuse(oldNote, [old], CHANGED_IN_NOTE);
      return true;
    }
    await this.changeOrRefuse(target, CHANGED_IN_NOTE, (text) => appendedShown(text, added));
    try {
      await this.removeOrRefuse(oldNote, [old], OLD_LINE_LEFT);
    } catch (error) {
      if (messageOf(error) === OLD_LINE_LEFT) throw new PartlyWritten(OLD_LINE_LEFT);
      throw new PartlyWritten(`The new line was written, but the old one was left: ${messageOf(error)} Remove one of them by hand.`);
    }
    return true;
  }

  async rewrite(old: Removal, line: string): Promise<boolean> {
    await this.changeOrRefuse(this.fileAt(old.path), CHANGED_IN_NOTE, (text) => rewriteLine(text, old, line));
    return true;
  }

  async drop(old: Removal): Promise<boolean> {
    await this.changeOrRefuse(this.fileAt(old.path), CHANGED_IN_NOTE, (text) => dropLine(text, old));
    return true;
  }

  async changeText(path: string, refusal: string, change: (text: string) => string | null): Promise<void> {
    await this.changeOrRefuse(this.fileAt(path), refusal, change);
  }

  ensureExists(paths: string[]): void {
    for (const path of paths) this.fileAt(path);
  }

  async remove(removal: Removal): Promise<boolean> {
    await this.removeOrRefuse(this.fileAt(removal.path), [removal], CHANGED_IN_NOTE);
    return true;
  }

  async removeWithItsLines(own: Removal, others: Removal[]): Promise<boolean> {
    const alongside = others.filter((removal) => removal.path === own.path);
    const elsewhere = new Map<string, Removal[]>();
    for (const removal of others.filter((other) => other.path !== own.path)) {
      const group = elsewhere.get(removal.path);
      if (group === undefined) elsewhere.set(removal.path, [removal]);
      else group.push(removal);
    }
    const ownNote = this.fileAt(own.path);
    const otherNotes = [...elsewhere].map(([path, group]) => ({ path, file: this.fileAt(path), group }));
    for (const { file, group } of otherNotes) await this.checkRemoval(file, group);
    const leftIn: string[] = [];
    if (await this.removeOwnLine(ownNote, own, alongside)) leftIn.push(own.path);
    for (const { path, file, group } of otherNotes) {
      let left = false;
      try {
        await this.changeOrRefuse(file, CHANGED_IN_NOTE, (text) => {
          const removal = removeLines(text, group);
          left = removal.removed < group.length;
          return removal.text;
        });
      } catch (error) {
        throw new PartlyWritten(`It was deleted, but its lines in ${path} were left: ${messageOf(error)}`);
      }
      if (left) leftIn.push(path);
    }
    if (leftIn.length > 0) throw new PartlyWritten(`${LINES_LEFT} ${leftIn.join(", ")}.`);
    return true;
  }

  private async removeOwnLine(file: TFile, own: Removal, alongside: Removal[]): Promise<boolean> {
    let left = false;
    await this.changeOrRefuse(file, CHANGED_IN_NOTE, (text) => {
      if (removeLines(text, [own]).removed === 0) return null;
      const removal = removeLines(text, [own, ...alongside]);
      left = removal.removed < alongside.length + 1;
      return removal.text;
    });
    return left;
  }

  private async checkRemoval(file: TFile, removals: Removal[]): Promise<number> {
    const text = await this.files.read(file);
    const removal = removeLines(text, removals);
    if (!keepsProperties(text, removal.text)) throw new Error(PROPERTIES_WOULD_CHANGE);
    return removal.removed;
  }

  private async removeOrRefuse(file: TFile, removals: Removal[], message: string): Promise<void> {
    await this.changeOrRefuse(file, message, (text) => {
      const removal = removeLines(text, removals);
      if (removal.removed < removals.length) return null;
      return removal.text;
    });
  }

  private async changeOrRefuse(file: TFile, message: string, change: (text: string) => string | Refusal | null): Promise<void> {
    let refusal: string | null = null;
    await this.files.process(file, (text) => {
      const changed = change(text);
      if (changed === null) {
        refusal = message;
        return text;
      }
      if (typeof changed !== "string") {
        refusal = changed.refusal;
        return text;
      }
      if (!keepsProperties(text, changed)) {
        refusal = PROPERTIES_WOULD_CHANGE;
        return text;
      }
      return changed;
    });
    if (refusal !== null) throw new Error(refusal);
  }

  private fileAt(path: string): TFile {
    const file = this.files.getFileByPath(path);
    if (file === null) throw new Error(`${path} was moved or deleted`);
    return file;
  }
}
