import type { ReferenceKindName } from "../kinds/reference-kind";
import { findLinks, findPlaceLinks } from "../notes/parts/link";
import { characterLinksIn } from "./character-roles/character-roles";

export interface NameOnLine {
  name: string;
  kind: ReferenceKindName | null;
}

function kindOfName(name: string, text: string): ReferenceKindName | null {
  if (findPlaceLinks(text).includes(name)) return "place";
  if (characterLinksIn(text).includes(name)) return "character";
  return null;
}

export function namesOnLine(text: string): NameOnLine[] {
  const names = new Set(findLinks(text));
  return [...names].map((name) => ({ name, kind: kindOfName(name, text) }));
}
