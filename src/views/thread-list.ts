import type { SourcedText, Thread } from "../campaign/campaign";
import { unlink } from "../notes/link";
import type { ListContents } from "./list-page";

type FactsOf<T> = (thread: T) => string[];

function searchableTextOf<T extends Thread<SourcedText>>(thread: T, factsOf: FactsOf<T>): string {
  const texts = [thread.text, ...factsOf(thread)];
  if (thread.closing !== null) texts.push(thread.closing.text);
  return unlink(texts.join(" ")).toLowerCase();
}

function matchesEvery<T extends Thread<SourcedText>>(thread: T, keywords: string[], factsOf: FactsOf<T>): boolean {
  const text = searchableTextOf(thread, factsOf);
  return keywords.every((keyword) => text.includes(keyword));
}

export function listThreads<T extends Thread<SourcedText>>(threads: T[], keywords: string[], factsOf: FactsOf<T>): ListContents<T> {
  const newestFirst = [...threads].reverse();
  const open = newestFirst.filter((thread) => thread.closing === null);
  const closed = newestFirst.filter((thread) => thread.closing !== null);
  return {
    open: open.filter((thread) => matchesEvery(thread, keywords, factsOf)),
    folded: closed.filter((thread) => matchesEvery(thread, keywords, factsOf)),
    openCount: open.length,
    foldedCount: closed.length,
  };
}
