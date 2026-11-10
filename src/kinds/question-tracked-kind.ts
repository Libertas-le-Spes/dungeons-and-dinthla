import type { LookedUpKind } from "./looked-up-kind";
import type { LookupFinders } from "./lookup-finders";
import type { LookupOpeners } from "./lookup-openers";
import type { Source } from "./source";

function openQuestion(openers: LookupOpeners, _text: string, source: Source, onClosed: () => void): void {
  openers.question(source, onClosed);
}

function findQuestions<Match>(finders: LookupFinders<Match>, keywords: string[]): Match[] {
  return finders.question(keywords);
}

export const questionTrackedKind = {
  name: "question",
  marker: { name: "question", symbol: "?", colourClass: "dd-marker-question" },
  followUps: { clue: "?+", answer: "?=" },
  folder: "Questions",
  page: "questions",
  lookup: {
    symbol: "??",
    words: { pick: "Pick the question to answer", noMatch: "No open question matches", none: "No open questions" },
    showsHolder: false,
    open: openQuestion,
    find: findQuestions,
  },
} satisfies LookedUpKind;
