import type { Source, SourcedText } from "./campaign";
import { sessionNumberOf } from "./session-file";
import type { AnyThreadKind, ThreadRecord } from "./thread-kind";

export function placesOf<Record extends ThreadRecord, Ending extends SourcedText>(kind: AnyThreadKind<Record, Ending>, record: Record): Source[] {
  const sources = [record.source, ...kind.additionsOf(record).map((addition) => addition.source)];
  const ending = kind.endingOf(record);
  if (ending !== null) sources.push(ending.source);
  return sources;
}

export function latestSessionOf<Record extends ThreadRecord, Ending extends SourcedText>(
  kind: AnyThreadKind<Record, Ending>,
  record: Record,
  campaignFolder: string,
): number {
  let latest = 0;
  for (const source of placesOf(kind, record)) {
    const number = sessionNumberOf(source.path, campaignFolder);
    if (number !== null && number > latest) latest = number;
  }
  return latest;
}
