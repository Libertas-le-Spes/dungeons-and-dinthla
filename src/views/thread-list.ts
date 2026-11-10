import type { SourcedText } from "../campaign/campaign";
import type { ThreadKind, ThreadRecord } from "../campaign/thread-kind";
import type { FollowUpName } from "../kinds/follow-up-name";
import { unlink } from "../notes/link";
import type { ListContents } from "./list-page";

interface ListedKind<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName> {
  kind: ThreadKind<Thread, Ending, EndingName>;
  factsOf(record: Thread): string[];
}

function searchableTextOf<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  listed: ListedKind<Thread, Ending, EndingName>,
  record: Thread,
): string {
  const texts = [listed.kind.textOf(record), ...listed.factsOf(record)];
  const ending = listed.kind.endingOf(record);
  if (ending !== null) texts.push(ending.text);
  return unlink(texts.join(" ")).toLowerCase();
}

function matchesEvery<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  listed: ListedKind<Thread, Ending, EndingName>,
  record: Thread,
  keywords: string[],
): boolean {
  const text = searchableTextOf(listed, record);
  return keywords.every((keyword) => text.includes(keyword));
}

export function listThreads<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  listed: ListedKind<Thread, Ending, EndingName>,
  records: Thread[],
  keywords: string[],
): ListContents<Thread> {
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
