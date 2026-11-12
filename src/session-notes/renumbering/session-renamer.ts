import { messageOf } from "../../views/dialogs/message-of";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import type { SessionRename } from "./renumbering-plan";

export type RenameFiles = Pick<FencedFiles, "getFileByPath" | "rename">;

export interface RenameOutcome {
  renamed: SessionRename[];
  notRenamed: SessionRename[];
  failure: string | null;
}

export function sessionGoneWords(path: string): string {
  return `${path} is gone.`;
}

function afterThe(renames: SessionRename[], doneCount: number): SessionRename[] {
  return renames.slice(doneCount);
}

export class SessionRenamer {
  constructor(private readonly files: RenameFiles) {}

  async rename(renames: SessionRename[]): Promise<RenameOutcome> {
    const renamed: SessionRename[] = [];
    for (const rename of renames) {
      const failure = await this.renameOne(rename);
      if (failure !== null) return { renamed, notRenamed: afterThe(renames, renamed.length), failure };
      renamed.push(rename);
    }
    return { renamed, notRenamed: [], failure: null };
  }

  private async renameOne(rename: SessionRename): Promise<string | null> {
    const file = this.files.getFileByPath(rename.from);
    if (file === null) return sessionGoneWords(rename.from);
    try {
      await this.files.rename(file, rename.to);
    } catch (error) {
      return messageOf(error);
    }
    return null;
  }
}
