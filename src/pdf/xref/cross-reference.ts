import { MAX_XREF_ENTRIES } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { XrefEntry } from "./xref-entry";

export class CrossReference {
  private readonly entries = new Map<number, XrefEntry>();
  private seen = 0;

  count(declared: number): void {
    this.seen += declared;
    if (this.seen > MAX_XREF_ENTRIES) throw new PdfRefusal("The file's index lists too many objects, so it was not read.");
  }

  addIfNew(number: number, entry: XrefEntry): void {
    if (!this.entries.has(number)) this.entries.set(number, entry);
  }

  get(number: number): XrefEntry | undefined {
    return this.entries.get(number);
  }

  containerNumbers(): number[] {
    const numbers = new Set<number>();
    for (const entry of this.entries.values()) {
      const container = entry.containerNumber();
      if (container !== null) numbers.add(container);
    }
    return [...numbers].sort(byNumber);
  }
}

function byNumber(first: number, second: number): number {
  return first - second;
}
