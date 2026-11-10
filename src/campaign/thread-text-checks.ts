import type { FollowUpName } from "../kinds/follow-up-name";
import { oneLine } from "../notes/one-line";
import type { SourcedText } from "./campaign";
import { findSubject } from "./subject";
import type { ThreadKind, ThreadRecord } from "./thread-kind";

export function sharesTextWithEarlierOpenThread<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  kind: ThreadKind<Thread, Ending, EndingName>,
  records: Thread[],
  record: Thread,
): boolean {
  const index = records.indexOf(record);
  return records.slice(0, index).some((earlier) => kind.endingOf(earlier) === null && kind.textOf(earlier) === kind.textOf(record));
}

export function followUpWouldGoElsewhere<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  kind: ThreadKind<Thread, Ending, EndingName>,
  records: Thread[],
  record: Thread,
  text: string,
): boolean {
  const open = records.filter((candidate) => candidate === record || kind.endingOf(candidate) === null);
  const found = findSubject(`${kind.textOf(record)}: ${oneLine(text)}`, open, (candidate) => kind.textOf(candidate));
  return found !== null && found.candidate !== record;
}
