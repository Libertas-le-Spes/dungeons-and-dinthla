import { CompressedEntry } from "../entries/compressed-entry";
import { FreeEntry } from "../entries/free-entry";
import { InFileEntry } from "../entries/in-file-entry";
import type { XrefEntry } from "../entries/xref-entry";

export interface StreamRowKind {
  typeNumber: number;
  entryFor(second: number, third: number): XrefEntry;
}

class FreeRow implements StreamRowKind {
  readonly typeNumber = 0;

  entryFor(): XrefEntry {
    return new FreeEntry();
  }
}

class InFileRow implements StreamRowKind {
  readonly typeNumber = 1;

  entryFor(second: number, third: number): XrefEntry {
    return new InFileEntry(second, third);
  }
}

class CompressedRow implements StreamRowKind {
  readonly typeNumber = 2;

  entryFor(second: number, third: number): XrefEntry {
    return new CompressedEntry(second, third);
  }
}

export const STREAM_ROW_KINDS: readonly StreamRowKind[] = [new FreeRow(), new InFileRow(), new CompressedRow()];
