import { getFrontMatterInfo, type Vault } from "obsidian";
import { boxTextOf, withBomOf, withoutBom } from "../campaign/disk-text";

export type ClearerVault = Pick<Vault, "getFileByPath" | "process">;

export const SESSION_GONE = "the session's note is gone.";

export const CHANGED_SINCE_ASKED = "the session's note changed since you were asked, so nothing was cleared. Look at its notes again first.";

function propertiesOf(text: string): string {
  const properties = getFrontMatterInfo(text);
  if (!properties.exists) return "";
  return text.substring(0, properties.contentStart);
}

export function clearedText(disk: string): string {
  return withBomOf(disk, propertiesOf(withoutBom(disk)));
}

export class SessionClearer {
  constructor(private readonly vault: ClearerVault) {}

  async clear(path: string, asked: string): Promise<void> {
    const file = this.vault.getFileByPath(path);
    if (file === null) throw new Error(SESSION_GONE);
    let changedSince = false;
    await this.vault.process(file, (disk) => {
      if (boxTextOf(disk) === asked) return clearedText(disk);
      changedSince = true;
      return disk;
    });
    if (changedSince) throw new Error(CHANGED_SINCE_ASKED);
  }
}
