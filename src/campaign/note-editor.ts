import type { TFile, Vault } from "obsidian";
import { appendLines, dropLine, removeLines, rewriteLine, type LineToRemove } from "../notes/note-lines";
import { messageOf } from "../views/message-of";

export type EditorVault = Pick<Vault, "getFileByPath" | "process" | "read">;

export const CHANGED_IN_NOTE = "A line was changed in its note since the dialog was opened, so nothing was written.";
export const OLD_LINE_LEFT =
  "The new line was written, but the old one had changed in its note since, so it was left. Remove one of them by hand.";
export const LINES_LEFT = "It was deleted, but some of its lines had changed or moved since they were read, so they were left in";
export const DUPLICATE_LINES = "More than one line in the note reads like this one, so nothing was deleted.";

export class PartlyWritten extends Error {}

export interface Removal extends LineToRemove {
  path: string;
}

function countMatches(text: string, removal: Removal): number {
  return text.split("\n").filter((written) => removal.matches(written.replace(/\r$/, ""))).length;
}

export class NoteEditor {
  constructor(private readonly vault: EditorVault) {}

  async append(targetPath: string, added: string[]): Promise<boolean> {
    if (added.length === 0) return false;
    await this.vault.process(this.fileAt(targetPath), (text) => appendLines(text, added));
    return true;
  }

  async replace(targetPath: string, added: string[], old: Removal): Promise<boolean> {
    const target = this.fileAt(targetPath);
    if (old.path === targetPath) {
      await this.changeOrRefuse(target, CHANGED_IN_NOTE, (text) => {
        const removal = removeLines(text, [old]);
        if (removal.removed === 0) return null;
        return appendLines(removal.text, added);
      });
      return true;
    }
    const oldNote = this.fileAt(old.path);
    await this.refuseUnlessFound(oldNote, [old]);
    if (added.length === 0) {
      await this.removeOrRefuse(oldNote, [old], CHANGED_IN_NOTE);
      return true;
    }
    await this.vault.process(target, (text) => appendLines(text, added));
    try {
      await this.removeOrRefuse(oldNote, [old], OLD_LINE_LEFT);
    } catch (error) {
      throw new PartlyWritten(messageOf(error));
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
    const leftIn: string[] = [];
    if (await this.removeOwnLine(ownNote, own, alongside)) leftIn.push(own.path);
    for (const { path, file, group } of otherNotes) {
      let left = false;
      try {
        await this.vault.process(file, (text) => {
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
    let duplicated = false;
    let left = false;
    await this.changeOrRefuse(file, CHANGED_IN_NOTE, (text) => {
      if (countMatches(text, own) > 1) {
        duplicated = true;
        return text;
      }
      if (removeLines(text, [own]).removed === 0) return null;
      const removal = removeLines(text, [own, ...alongside]);
      left = removal.removed < alongside.length + 1;
      return removal.text;
    });
    if (duplicated) throw new Error(DUPLICATE_LINES);
    return left;
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
