import { getFrontMatterInfo, type Vault } from "obsidian";
import { boxTextOf, withBomOf, withoutBom } from "../campaign/disk-text";

export type ClearerVault = Pick<Vault, "getFileByPath" | "process">;

export const SESSION_GONE = "the session's note is gone.";

export const PROPERTIES_NOT_FOUND =
  "the session's note starts with --- but its properties couldn't be read, so nothing was cleared. Fix its properties with Edit all first.";

export const CHANGED_SINCE_ASKED = "the session's note changed since you were asked, so nothing was cleared. Look at its notes again first.";

function propertiesOf(text: string): string {
  const properties = getFrontMatterInfo(text);
  if (!properties.exists) return "";
  return text.substring(0, properties.contentStart);
}

export function clearedText(disk: string): string {
  return withBomOf(disk, propertiesOf(withoutBom(disk)));
}

const PROPERTIES_START = "---";

function hasUnreadProperties(text: string): boolean {
  if (!text.startsWith(PROPERTIES_START)) return false;
  return !getFrontMatterInfo(text).exists;
}

function refusalOf(disk: string, asked: string): string | null {
  if (boxTextOf(disk) !== asked) return CHANGED_SINCE_ASKED;
  if (hasUnreadProperties(withoutBom(disk))) return PROPERTIES_NOT_FOUND;
  return null;
}

export class SessionClearer {
  constructor(private readonly vault: ClearerVault) {}

  async clear(path: string, asked: string): Promise<void> {
    const file = this.vault.getFileByPath(path);
    if (file === null) throw new Error(SESSION_GONE);
    let refusal: string | null = null;
    await this.vault.process(file, (disk) => {
      refusal = refusalOf(disk, asked);
      if (refusal !== null) return disk;
      return clearedText(disk);
    });
    if (refusal !== null) throw new Error(refusal);
  }
}
