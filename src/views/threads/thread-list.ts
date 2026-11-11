import type { Campaign, SourcedText } from "../../campaign/record/campaign";
import type { ThreadRecord } from "../../campaign/threads/thread-kind";
import type { FollowUpName } from "../../kinds/follow-up-name";
import { unlink } from "../../notes/parts/link";
import type { ListContents } from "../lists/list-page";
import type { ShownThreadKind } from "./shown-thread-kind";

function searchableTextOf<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  shown: ShownThreadKind<Thread, Ending, EndingName>,
  thread: Thread,
): string {
  const texts = [shown.threadKind.textOf(thread), ...shown.factsOf(thread).map((fact) => fact.value)];
  const ending = shown.threadKind.endingOf(thread);
  if (ending !== null) texts.push(ending.text);
  return unlink(texts.join(" ")).toLowerCase();
}

function matchesEvery<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  shown: ShownThreadKind<Thread, Ending, EndingName>,
  thread: Thread,
  keywords: string[],
): boolean {
  const text = searchableTextOf(shown, thread);
  return keywords.every((keyword) => text.includes(keyword));
}

export function listThreads<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  shown: ShownThreadKind<Thread, Ending, EndingName>,
  campaign: Campaign,
  keywords: string[],
): ListContents<Thread> {
  const newestFirst = [...shown.threadsOf(campaign)].reverse();
  const open = newestFirst.filter((thread) => shown.threadKind.endingOf(thread) === null);
  const ended = newestFirst.filter((thread) => shown.threadKind.endingOf(thread) !== null);
  return {
    open: open.filter((thread) => matchesEvery(shown, thread, keywords)),
    folded: ended.filter((thread) => matchesEvery(shown, thread, keywords)),
    openCount: open.length,
    foldedCount: ended.length,
  };
}
