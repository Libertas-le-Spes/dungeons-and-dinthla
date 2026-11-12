import type { LookedUpKind } from "./looked-up-kind";
import type { LookupOpeners } from "./lookup-openers";
import type { Source } from "./source";

function openQuestion(openers: LookupOpeners, _text: string, source: Source, onClosed: () => void): void {
  openers.question(source, onClosed);
}

export const questionTrackedKind = {
  name: "question",
  marker: { name: "question", symbol: "?", colourClass: "dd-marker-question" },
  followUps: { clue: "?+", answer: "?=" },
  folder: "Questions",
  kindNoteFolder: "Questions",
  page: "questions",
  lookup: {
    symbol: "??",
    words: { pick: "Pick the question to answer", noMatch: "No open question matches", none: "No open questions" },
    showsHolder: false,
    open: openQuestion,
  },
} satisfies LookedUpKind;
