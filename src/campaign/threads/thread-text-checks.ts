import type { FollowUpName } from "../../kinds/follow-up-name";
import { oneLine } from "../../notes/parts/one-line";
import type { SourcedText } from "../record/campaign";
import { findSubject } from "../record/subject";
import type { ThreadKind, ThreadRecord } from "./thread-kind";

export function sharesTextWithEarlierOpenThread<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  kind: ThreadKind<Thread, Ending, EndingName>,
  threads: Thread[],
  thread: Thread,
): boolean {
  const index = threads.indexOf(thread);
  return threads.slice(0, index).some((earlier) => kind.endingOf(earlier) === null && kind.textOf(earlier) === kind.textOf(thread));
}

export function followUpWouldGoElsewhere<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  kind: ThreadKind<Thread, Ending, EndingName>,
  threads: Thread[],
  thread: Thread,
  text: string,
): boolean {
  const open = threads.filter((candidate) => candidate === thread || kind.endingOf(candidate) === null);
  const found = findSubject(`${kind.textOf(thread)}: ${oneLine(text)}`, open, (candidate) => kind.textOf(candidate));
  return found !== null && found.candidate !== thread;
}
