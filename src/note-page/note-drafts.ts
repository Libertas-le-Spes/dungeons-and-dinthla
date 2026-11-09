import type { Drafts, SaveListener } from "../session-notes/drafts";

export interface NoteDraft {
  base: string;
  text: string;
}

export type WriteNote = (path: string, draft: NoteDraft) => Promise<void>;

const KEY_START = "note:";

function keyOf(path: string): string {
  return `${KEY_START}${path}`;
}

function isKey(key: string): boolean {
  return key.startsWith(KEY_START);
}

function pathOf(key: string): string {
  return key.substring(KEY_START.length);
}

function isNoteDraft(read: unknown): read is NoteDraft {
  if (typeof read !== "object" || read === null) return false;
  if (!("base" in read) || !("text" in read)) return false;
  return typeof read.base === "string" && typeof read.text === "string";
}

function parsed(kept: string): unknown {
  try {
    return JSON.parse(kept);
  } catch {
    return null;
  }
}

function draftIn(kept: string): NoteDraft | null {
  if (kept === "") return null;
  const read = parsed(kept);
  if (!isNoteDraft(read)) return null;
  return read;
}

function keptTextOf(draft: NoteDraft): string {
  if (draft.text === draft.base) return "";
  return JSON.stringify({ base: draft.base, text: draft.text });
}

export class NoteDrafts {
  constructor(private readonly drafts: Drafts) {}

  draftOf(path: string): NoteDraft | null {
    return draftIn(this.drafts.textOf(keyOf(path)));
  }

  keep(path: string, draft: NoteDraft): void {
    this.drafts.keep(keyOf(path), keptTextOf(draft));
  }

  moved(oldPath: string, path: string): void {
    this.drafts.moved(keyOf(oldPath), keyOf(path));
  }

  isSaving(path: string): boolean {
    return this.drafts.isSaving(keyOf(path));
  }

  subscribe(listener: SaveListener): () => void {
    return this.drafts.subscribe((key) => {
      if (isKey(key)) listener(pathOf(key));
    });
  }

  async save(path: string, write: WriteNote): Promise<boolean> {
    return this.drafts.save(keyOf(path), async (key, kept) => {
      const draft = draftIn(kept);
      if (draft === null) return kept;
      await write(pathOf(key), draft);
      return "";
    });
  }
}
