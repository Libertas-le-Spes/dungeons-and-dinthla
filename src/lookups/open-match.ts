import type { Source } from "../campaign/campaign";
import type { LookupKind, LookupMatch } from "./lookup";

export interface LookupOpeners {
  question(source: Source, onClosed: () => void): void;
  quest(source: Source, onClosed: () => void): void;
  item(name: string, source: Source, onClosed: () => void): void;
}

type OpenOfKind = (openers: LookupOpeners, match: LookupMatch, source: Source, onClosed: () => void) => void;

function openQuestion(openers: LookupOpeners, _match: LookupMatch, source: Source, onClosed: () => void): void {
  openers.question(source, onClosed);
}

function openQuest(openers: LookupOpeners, _match: LookupMatch, source: Source, onClosed: () => void): void {
  openers.quest(source, onClosed);
}

function openItem(openers: LookupOpeners, match: LookupMatch, source: Source, onClosed: () => void): void {
  openers.item(match.text, source, onClosed);
}

const OPEN_BY_KIND: Record<LookupKind, OpenOfKind> = { question: openQuestion, quest: openQuest, item: openItem };

export function openMatch(openers: LookupOpeners, match: LookupMatch, source: Source, onClosed: () => void): void {
  OPEN_BY_KIND[match.kind](openers, match, source, onClosed);
}
