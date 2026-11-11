import type { Drafts } from "../drafts/drafts";
import { keptKeyIn, keptKeyOf, type KeptKey } from "./kept-key";
import type { KeptKind } from "../kept-kinds/kept-kind";
import { DELETED, MISSING, MOVED } from "../kept-kinds/kept-kinds";

export interface KeptDraft extends KeptKey {
  key: string;
  text: string;
}

export type NoteExists = (path: string) => boolean;

function isInside(key: string, path: string): boolean {
  return key === path || key.startsWith(`${path}/`);
}

function byKeptTime(first: KeptDraft, second: KeptDraft): number {
  return first.keptAt - second.keptAt;
}

function joined(text: string, added: string): string {
  if (text === "") return added;
  return `${text}\n${added}`;
}

export class KeptDrafts {
  constructor(
    private readonly drafts: Drafts,
    private readonly now: () => number,
  ) {}

  noteDeleted(path: string): void {
    for (const key of this.drafts.keys()) {
      if (isInside(key, path)) this.setAside(DELETED, key);
    }
  }

  noteRenamed(oldPath: string, path: string): void {
    if (oldPath !== path) this.setAside(MISSING, path);
    this.drafts.moved(oldPath, path);
  }

  notesGone(exists: NoteExists): void {
    for (const key of this.drafts.keys()) {
      if (this.isGone(key, exists)) this.setAside(MISSING, key);
    }
  }

  keepMoved(old: Record<string, string>): void {
    for (const [path, text] of Object.entries(old)) this.drafts.keep(this.freeKeyFor(MOVED, path), text);
  }

  kept(): KeptDraft[] {
    const kept: KeptDraft[] = [];
    for (const key of this.drafts.keys()) {
      const parts = keptKeyIn(key);
      if (parts !== null) kept.push({ key, ...parts, text: this.drafts.textOf(key) });
    }
    return kept.sort(byKeptTime);
  }

  isKept(key: string): boolean {
    return keptKeyIn(key) !== null;
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

  private isGone(key: string, exists: NoteExists): boolean {
    if (this.isKept(key)) return false;
    return !exists(key);
  }

  private setAside(kind: KeptKind, path: string): void {
    this.drafts.setAside(path, this.freeKeyFor(kind, path));
  }

  private freeKeyFor(kind: KeptKind, path: string): string {
    let keptAt = this.now();
    while (this.drafts.keys().includes(keptKeyOf(kind, path, keptAt))) keptAt += 1;
    return keptKeyOf(kind, path, keptAt);
  }
}
