import { messageOf } from "../../views/dialogs/message-of";
import type { NoteStore } from "../../host/notes/note-store";
import type { SessionRename } from "./renumbering-plan";
import { renameSourceGoneWords } from "./renumbering-words";

export type RenameFiles = Pick<NoteStore, "note" | "move">;

export interface RenameOutcome {
  renamed: SessionRename[];
  notRenamed: SessionRename[];
  failure: string | null;
}

function notYetRenamed(renames: SessionRename[], renamed: SessionRename[]): SessionRename[] {
  return renames.filter((rename) => !renamed.includes(rename));
}

export class SessionRenamer {
  constructor(private readonly files: RenameFiles) {}

  async rename(renames: SessionRename[]): Promise<RenameOutcome> {
    const renamed: SessionRename[] = [];
    for (const rename of renames) {
      const failure = await this.renameOne(rename);
      if (failure !== null) return { renamed, notRenamed: notYetRenamed(renames, renamed), failure };
      renamed.push(rename);
    }
    return { renamed, notRenamed: [], failure: null };
  }

  private async renameOne(rename: SessionRename): Promise<string | null> {
    const file = this.files.note(rename.from);
    if (file === null) return renameSourceGoneWords(rename.from);
    try {
      await this.files.move(file, rename.to);
    } catch (error) {
      return messageOf(error);
    }
    return null;
  }
}
