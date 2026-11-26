import type { LinkCounts, LinkLookup } from "../../host/notes/link-lookup";
import type { NoteRef } from "../../host/notes/note-ref";
import type { HandedNotes } from "./handed-notes";

export class FencedLinks implements LinkLookup {
  constructor(
    private readonly raw: LinkLookup,
    private readonly handed: HandedNotes,
  ) {}

  target(linkText: string, fromPath: string): NoteRef | null {
    if (!this.handed.holds(fromPath)) return null;
    return this.handed.hand(this.raw.target(linkText, fromPath));
  }

  linkTextTo(note: NoteRef, fromPath: string, withoutEnding: boolean): string {
    return this.raw.linkTextTo(this.handed.held(note), this.handed.insidePath(fromPath), withoutEnding);
  }

  unresolvedIn(path: string): string[] {
    if (!this.handed.holds(path)) return [];
    return this.raw.unresolvedIn(path);
  }

  linkCounts(): LinkCounts {
    const inside: [string, Record<string, number>][] = [];
    for (const [from, targets] of Object.entries(this.raw.linkCounts())) {
      if (this.handed.holds(from)) inside.push([from, this.countsInside(targets)]);
    }
    return Object.fromEntries(inside);
  }

  private countsInside(targets: Readonly<Record<string, number>>): Record<string, number> {
    const inside: [string, number][] = [];
    for (const [target, count] of Object.entries(targets)) {
      if (this.handed.holds(target)) inside.push([target, count]);
    }
    return Object.fromEntries(inside);
  }
}
