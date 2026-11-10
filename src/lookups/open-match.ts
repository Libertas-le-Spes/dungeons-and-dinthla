import type { Source } from "../campaign/campaign";
import { lookedUpKindNamed } from "../kinds/looked-up-kinds";
import type { LookupOpeners } from "../kinds/lookup-openers";
import type { LookupMatch } from "./lookup";

export function openMatch(openers: LookupOpeners, match: LookupMatch, source: Source, onClosed: () => void): void {
  lookedUpKindNamed(match.kind).lookup.open(openers, match.text, source, onClosed);
}
