import type { FollowUpName } from "../kinds/follow-up-name";
import { isFollowUpLine } from "../notes/thread-lines";
import type { SourcedText, Thread } from "./campaign";
import type { Removal } from "./note-editor";

function followUpRemoval(thread: Thread<SourcedText>, name: FollowUpName, followUp: SourcedText): Removal {
  return {
    path: followUp.source.path,
    line: followUp.source.line,
    matches: (written) => isFollowUpLine(written, name, thread.text, followUp.text),
  };
}

export function openingRemoval(thread: Thread<SourcedText>, isOpeningLine: (written: string, text: string) => boolean): Removal {
  return { path: thread.source.path, line: thread.source.line, matches: (written) => isOpeningLine(written, thread.text) };
}

export function closingRemoval<Closing extends SourcedText>(thread: Thread<Closing>, nameOf: (closing: Closing) => FollowUpName): Removal | null {
  const closing = thread.closing;
  if (closing === null) return null;
  return followUpRemoval(thread, nameOf(closing), closing);
}

export function followUpRemovals(thread: Thread<SourcedText>, noteName: FollowUpName, closing: Removal | null): Removal[] {
  const removals = thread.notes.map((note) => followUpRemoval(thread, noteName, note));
  if (closing !== null) removals.push(closing);
  return removals;
}
