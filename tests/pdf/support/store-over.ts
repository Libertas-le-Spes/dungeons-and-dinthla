import { ObjectStore } from "../../../src/pdf/file/object-store";
import { VALUE_PARSER } from "../../../src/pdf/parsing/object-readers";
import { CrossReference } from "../../../src/pdf/xref/cross-reference";
import { InFileEntry } from "../../../src/pdf/xref/in-file-entry";
import type { XrefEntry } from "../../../src/pdf/xref/xref-entry";
import { bytesOfText, budgetFor } from "./cursors";

export function storeOver(text: string, entries: Map<number, XrefEntry>): ObjectStore {
  const bytes = bytesOfText(text);
  const crossReference = new CrossReference();
  for (const [number, entry] of entries) crossReference.addIfNew(number, entry);
  return new ObjectStore(bytes, 0, budgetFor(bytes.byteLength), VALUE_PARSER, crossReference);
}

export function storeOfObjects(text: string, numbers: number[]): ObjectStore {
  const entries = new Map<number, XrefEntry>();
  for (const number of numbers) entries.set(number, new InFileEntry(text.indexOf(`\n${number} 0 obj`) + 1, 0));
  return storeOver(text, entries);
}
