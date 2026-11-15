import type { ReferenceKindName } from "../kinds/reference-kind";
import { findLinks } from "../notes/parts/link";
import { READERS_STRONGEST_FIRST, strongestKind } from "./readers/reference-readers";

export interface NameOnLine {
  name: string;
  kind: ReferenceKindName | null;
}

function kindOfName(name: string, text: string): ReferenceKindName | null {
  const reading = READERS_STRONGEST_FIRST.filter((reader) => reader.linksIn(text).includes(name));
  return strongestKind(reading.map((reader) => reader.kind));
}

export function namesOnLine(text: string): NameOnLine[] {
  const names = new Set(findLinks(text).filter((name) => name !== ""));
  return [...names].map((name) => ({ name, kind: kindOfName(name, text) }));
}
