import type { FollowUpName } from "../kinds/follow-up-name";
import type { Source, SourcedText } from "./campaign";
import { sessionNumberOf } from "./session-file";
import type { ThreadKind, ThreadRecord } from "./thread-kind";

export function placesOf<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  kind: ThreadKind<Thread, Ending, EndingName>,
  record: Thread,
): Source[] {
  const sources = [record.source, ...kind.additionsOf(record).map((addition) => addition.source)];
  const ending = kind.endingOf(record);
  if (ending !== null) sources.push(ending.source);
  return sources;
}

export function latestSessionOf<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  kind: ThreadKind<Thread, Ending, EndingName>,
  record: Thread,
  campaignFolder: string,
): number {
  let latest = 0;
  for (const source of placesOf(kind, record)) {
    const number = sessionNumberOf(source.path, campaignFolder);
    if (number !== null && number > latest) latest = number;
  }
  return latest;
}
