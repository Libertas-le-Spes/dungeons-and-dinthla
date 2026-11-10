import type { Source } from "../campaign/campaign";
import { lookedUpKindNamed } from "../kinds/looked-up-kinds";
import type { LookupMatch } from "./lookup";

export interface LookupOpeners {
  question(source: Source, onClosed: () => void): void;
  quest(source: Source, onClosed: () => void): void;
  item(name: string, source: Source, onClosed: () => void): void;
}

export function openMatch(openers: LookupOpeners, match: LookupMatch, source: Source, onClosed: () => void): void {
  lookedUpKindNamed(match.kind).open(openers, match, source, onClosed);
}
