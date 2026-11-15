import type { CleanLine } from "../../../text/clean-line";
import type { JsonReader } from "../../json/json-reader";
import { definitionNameOf } from "../../parts/definition-name";

export function namedIdsOf(entries: readonly JsonReader[]): ReadonlyMap<number, CleanLine> {
  const found = new Map<number, CleanLine>();
  for (const entry of entries) {
    const id = entry.readerAt("definition").numberAt("id");
    if (id !== null) found.set(id, definitionNameOf(entry));
  }
  return found;
}
