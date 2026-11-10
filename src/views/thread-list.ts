import type { SourcedText } from "../campaign/campaign";
import type { AnyThreadKind, ThreadRecord } from "../campaign/thread-kind";
import { unlink } from "../notes/link";
import type { ListContents } from "./list-page";

interface ListedKind<Record extends ThreadRecord, Ending extends SourcedText> {
  kind: AnyThreadKind<Record, Ending>;
  factsOf(record: Record): string[];
}

function searchableTextOf<Record extends ThreadRecord, Ending extends SourcedText>(listed: ListedKind<Record, Ending>, record: Record): string {
  const texts = [listed.kind.textOf(record), ...listed.factsOf(record)];
  const ending = listed.kind.endingOf(record);
  if (ending !== null) texts.push(ending.text);
  return unlink(texts.join(" ")).toLowerCase();
}

function matchesEvery<Record extends ThreadRecord, Ending extends SourcedText>(listed: ListedKind<Record, Ending>, record: Record, keywords: string[]): boolean {
  const text = searchableTextOf(listed, record);
  return keywords.every((keyword) => text.includes(keyword));
}

export function listThreads<Record extends ThreadRecord, Ending extends SourcedText>(
  listed: ListedKind<Record, Ending>,
  records: Record[],
  keywords: string[],
): ListContents<Record> {
  const newestFirst = [...records].reverse();
  const open = newestFirst.filter((record) => listed.kind.endingOf(record) === null);
  const ended = newestFirst.filter((record) => listed.kind.endingOf(record) !== null);
  return {
    open: open.filter((record) => matchesEvery(listed, record, keywords)),
    folded: ended.filter((record) => matchesEvery(listed, record, keywords)),
    openCount: open.length,
    foldedCount: ended.length,
  };
}
