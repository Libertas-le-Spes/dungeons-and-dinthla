import type { ReferenceKindName } from "../../kinds/reference-kind";
import { characterReader } from "./character-reader";
import { placeReader } from "./place-reader";
import type { ReferenceReader } from "./reference-reader";

export const READERS_STRONGEST_FIRST: ReferenceReader[] = [placeReader, characterReader];

export function strongestKind(kinds: ReferenceKindName[]): ReferenceKindName | null {
  for (const reader of READERS_STRONGEST_FIRST) {
    if (kinds.includes(reader.kind)) return reader.kind;
  }
  return null;
}
