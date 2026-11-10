import type { Source } from "../campaign/campaign";
import type { LookupMatch } from "../lookups/lookup";
import type { LookupOpeners } from "../lookups/open-match";
import type { LookedUpKind } from "./looked-up-kind";

function openQuestion(openers: LookupOpeners, _match: LookupMatch, source: Source, onClosed: () => void): void {
  openers.question(source, onClosed);
}

export const questionSourceKind: LookedUpKind = {
  name: "question",
  marker: { name: "question", symbol: "?", colourClass: "dd-marker-question" },
  followUps: [
    { symbol: "?+", kind: "clue" },
    { symbol: "?=", kind: "answer" },
  ],
  folder: "Questions",
  page: "questions",
  lookupSymbol: "??",
  lookupWords: { pick: "Pick the question to answer", noMatch: "No open question matches", none: "No open questions" },
  showsHolder: false,
  open: openQuestion,
};
