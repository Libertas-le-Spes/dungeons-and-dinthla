import type { Drafts } from "./drafts";

const KEY_START = "deleted:";
const TIME_END = ":";

export interface DeletedDraft {
  key: string;
  path: string;
  deletedAt: number;
  text: string;
}

function keyOf(path: string, deletedAt: number): string {
  return `${KEY_START}${deletedAt}${TIME_END}${path}`;
}

function isInside(key: string, path: string): boolean {
  return key === path || key.startsWith(`${path}/`);
}

function partsOf(key: string): { path: string; deletedAt: number } | null {
  if (!key.startsWith(KEY_START)) return null;
  const rest = key.substring(KEY_START.length);
  const timeEnd = rest.indexOf(TIME_END);
  if (timeEnd < 1) return null;
  const deletedAt = Number(rest.substring(0, timeEnd));
  if (!Number.isSafeInteger(deletedAt)) return null;
  return { path: rest.substring(timeEnd + TIME_END.length), deletedAt };
}

function byDeletedTime(first: DeletedDraft, second: DeletedDraft): number {
  return first.deletedAt - second.deletedAt;
}

function joined(text: string, added: string): string {
  if (text === "") return added;
  return `${text}\n${added}`;
}

export class DeletedDrafts {
  constructor(
    private readonly drafts: Drafts,
    private readonly now: () => number,
  ) {}

  noteDeleted(path: string): void {
    for (const key of this.drafts.keys()) {
      if (isInside(key, path)) this.drafts.setAside(key, this.freeKeyFor(key));
    }
  }

  kept(): DeletedDraft[] {
    const kept: DeletedDraft[] = [];
    for (const key of this.drafts.keys()) {
      const parts = partsOf(key);
      if (parts !== null) kept.push({ key, ...parts, text: this.drafts.textOf(key) });
    }
    return kept.sort(byDeletedTime);
  }

  isKept(key: string): boolean {
    return partsOf(key) !== null;
  }

  canCopy(key: string, path: string): boolean {
    return !this.drafts.isSaving(key) && !this.drafts.isSaving(path);
  }

  copyInto(key: string, path: string): void {
    if (!this.isKept(key) || !this.canCopy(key, path)) return;
    const text = this.drafts.textOf(key);
    if (text === "") return;
    this.drafts.keep(path, joined(this.drafts.textOf(path), text));
    this.drafts.keep(key, "");
  }

  discard(key: string): void {
    if (!this.isKept(key) || this.drafts.isSaving(key)) return;
    this.drafts.keep(key, "");
  }

  private freeKeyFor(path: string): string {
    let deletedAt = this.now();
    while (this.drafts.keys().includes(keyOf(path, deletedAt))) deletedAt += 1;
    return keyOf(path, deletedAt);
  }
}
