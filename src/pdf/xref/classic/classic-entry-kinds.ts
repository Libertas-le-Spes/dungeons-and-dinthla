import { byteOf } from "../../bytes/byte-codes";
import { PdfRefusal } from "../../refusals/pdf-refusal";
import { FreeEntry } from "../entries/free-entry";
import { InFileEntry } from "../entries/in-file-entry";
import type { XrefEntry } from "../entries/xref-entry";

export interface ClassicEntryKind {
  mark: number;
  entryFor(offset: number, generation: number, fileLength: number): XrefEntry;
}

class InFileKind implements ClassicEntryKind {
  readonly mark = byteOf("n");

  entryFor(offset: number, generation: number, fileLength: number): XrefEntry {
    if (offset >= fileLength) throw new PdfRefusal("The file's index points at a place outside the file, so it was not read.");
    return new InFileEntry(offset, generation);
  }
}

class FreeKind implements ClassicEntryKind {
  readonly mark = byteOf("f");

  entryFor(): XrefEntry {
    return new FreeEntry();
  }
}

export const CLASSIC_ENTRY_KINDS: readonly ClassicEntryKind[] = [new InFileKind(), new FreeKind()];
