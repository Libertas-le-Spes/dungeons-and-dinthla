import { ObjectStore } from "../../../src/pdf/file/object-store";
import { VALUE_PARSER } from "../../../src/pdf/parsing/object-readers";
import { CrossReference } from "../../../src/pdf/xref/cross-reference";
import { InFileEntry } from "../../../src/pdf/xref/in-file-entry";
import type { XrefEntry } from "../../../src/pdf/xref/xref-entry";
import type { WorkBudget } from "../../../src/pdf/work/work-budget";
import { bytesOfText, budgetFor } from "./cursors";

export function storeOver(text: string, entries: Map<number, XrefEntry>, work: WorkBudget = budgetFor(text.length)): ObjectStore {
  const bytes = bytesOfText(text);
  const crossReference = new CrossReference();
  for (const [number, entry] of entries) crossReference.addIfNew(number, entry);
  return new ObjectStore(bytes, 0, work, VALUE_PARSER, crossReference);
}

export function storeOfObjects(text: string, numbers: number[], work: WorkBudget = budgetFor(text.length)): ObjectStore {
  const entries = new Map<number, XrefEntry>();
  for (const number of numbers) entries.set(number, new InFileEntry(text.indexOf(`\n${number} 0 obj`) + 1, 0));
  return storeOver(text, entries, work);
}
