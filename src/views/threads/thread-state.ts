import type { SourcedText } from "../../campaign/campaign";
import type { ThreadRecord } from "../../campaign/thread-kind";
import type { FollowUpName } from "../../kinds/follow-up-name";
import type { LineState } from "./line-state";
import type { ShownThreadKind } from "./shown-thread-kind";

export function threadStateOf<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  shown: ShownThreadKind<Thread, Ending, EndingName>,
  thread: Thread,
): LineState | null {
  const ending = shown.threadKind.endingOf(thread);
  if (ending === null) return null;
  return shown.endedLookOf(ending).state;
}
