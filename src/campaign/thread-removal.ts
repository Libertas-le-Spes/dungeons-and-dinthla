import type { FollowUpName } from "../kinds/follow-up-name";
import { isFollowUpLine } from "../notes/thread-lines";
import type { SourcedText } from "./campaign";
import type { Removal } from "./note-editor";
import type { AnyThreadKind, ThreadRecord } from "./thread-kind";

function followUpRemoval(subject: string, name: FollowUpName, followUp: SourcedText): Removal {
  return {
    path: followUp.source.path,
    line: followUp.source.line,
    matches: (written) => isFollowUpLine(written, name, subject, followUp.text),
  };
}

export function openingRemoval<Record extends ThreadRecord, Ending extends SourcedText>(kind: AnyThreadKind<Record, Ending>, record: Record): Removal {
  const text = kind.textOf(record);
  return { path: record.source.path, line: record.source.line, matches: (written) => kind.isOpeningLine(written, text) };
}

export function endingRemoval<Record extends ThreadRecord, Ending extends SourcedText>(kind: AnyThreadKind<Record, Ending>, record: Record): Removal | null {
  const ending = kind.endingOf(record);
  if (ending === null) return null;
  return followUpRemoval(kind.textOf(record), kind.endingNameOf(ending), ending);
}

export function followUpRemovals<Record extends ThreadRecord, Ending extends SourcedText>(kind: AnyThreadKind<Record, Ending>, record: Record): Removal[] {
  const text = kind.textOf(record);
  const removals = kind.additionsOf(record).map((addition) => followUpRemoval(text, kind.addingName, addition));
  const ending = endingRemoval(kind, record);
  if (ending !== null) removals.push(ending);
  return removals;
}
