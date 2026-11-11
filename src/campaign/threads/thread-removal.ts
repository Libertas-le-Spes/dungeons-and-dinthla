import type { FollowUpName } from "../../kinds/follow-up-name";
import { isFollowUpLine } from "../../notes/writing/thread-lines";
import type { SourcedText } from "../record/campaign";
import type { Removal } from "../writing/note-editor";
import type { ThreadKind, ThreadRecord } from "./thread-kind";

function followUpRemoval(subject: string, name: FollowUpName, followUp: SourcedText): Removal {
  return {
    path: followUp.source.path,
    line: followUp.source.line,
    matches: (written) => isFollowUpLine(written, name, subject, followUp.text),
  };
}

export function openingRemoval<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  kind: ThreadKind<Thread, Ending, EndingName>,
  thread: Thread,
): Removal {
  const text = kind.textOf(thread);
  return { path: thread.source.path, line: thread.source.line, matches: (written) => kind.isOpeningLine(written, text) };
}

export function endingRemoval<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  kind: ThreadKind<Thread, Ending, EndingName>,
  thread: Thread,
): Removal | null {
  const ending = kind.endingOf(thread);
  if (ending === null) return null;
  return followUpRemoval(kind.textOf(thread), kind.endingNameOf(ending), ending);
}

export function followUpRemovals<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  kind: ThreadKind<Thread, Ending, EndingName>,
  thread: Thread,
): Removal[] {
  const text = kind.textOf(thread);
  const removals = kind.additionsOf(thread).map((addition) => followUpRemoval(text, kind.addingName, addition));
  const ending = endingRemoval(kind, thread);
  if (ending !== null) removals.push(ending);
  return removals;
}
