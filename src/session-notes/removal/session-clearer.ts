import { boxTextOf, withBomOf, withoutBom } from "../../campaign/writing/disk-text";
import type { NoteStore } from "../../host/notes/note-store";
import type { NoteSyntax } from "../../host/rules/note-syntax";

export type ClearerFiles = Pick<NoteStore, "note" | "change">;

export type ClearerSyntax = Pick<NoteSyntax, "propertiesIn">;

export const SESSION_GONE = "the session's note is gone.";

export const PROPERTIES_NOT_FOUND =
  "the session's note starts with --- but its properties couldn't be read, so nothing was cleared. Fix its properties with Edit all first.";

export const CHANGED_SINCE_ASKED = "the session's note changed since you were asked, so nothing was cleared. Look at its notes again first.";

function propertiesOf(text: string, syntax: ClearerSyntax): string {
  const properties = syntax.propertiesIn(text);
  if (!properties.exists) return "";
  return text.substring(0, properties.contentStart);
}

export function clearedText(disk: string, syntax: ClearerSyntax): string {
  return withBomOf(disk, propertiesOf(withoutBom(disk), syntax));
}

const PROPERTIES_START = "---";

function hasUnreadProperties(text: string, syntax: ClearerSyntax): boolean {
  if (!text.startsWith(PROPERTIES_START)) return false;
  return !syntax.propertiesIn(text).exists;
}

function refusalOf(disk: string, asked: string, syntax: ClearerSyntax): string | null {
  if (boxTextOf(disk) !== asked) return CHANGED_SINCE_ASKED;
  if (hasUnreadProperties(withoutBom(disk), syntax)) return PROPERTIES_NOT_FOUND;
  return null;
}

export class SessionClearer {
  constructor(
    private readonly files: ClearerFiles,
    private readonly syntax: ClearerSyntax,
  ) {}

  async clear(path: string, asked: string): Promise<void> {
    const file = this.files.note(path);
    if (file === null) throw new Error(SESSION_GONE);
    let refusal: string | null = null;
    await this.files.change(file, (disk) => {
      refusal = refusalOf(disk, asked, this.syntax);
      if (refusal !== null) return disk;
      return clearedText(disk, this.syntax);
    });
    if (refusal !== null) throw new Error(refusal);
  }
}
