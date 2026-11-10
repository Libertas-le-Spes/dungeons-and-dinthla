import { oneLine } from "../notes/one-line";
import type { SourcedText } from "./campaign";
import { findSubject } from "./subject";
import type { AnyThreadKind, ThreadRecord } from "./thread-kind";

export function sharesTextWithEarlierOpenThread<Record extends ThreadRecord, Ending extends SourcedText>(
  kind: AnyThreadKind<Record, Ending>,
  records: Record[],
  record: Record,
): boolean {
  const index = records.indexOf(record);
  return records.slice(0, index).some((earlier) => kind.endingOf(earlier) === null && kind.textOf(earlier) === kind.textOf(record));
}

export function followUpWouldGoElsewhere<Record extends ThreadRecord, Ending extends SourcedText>(
  kind: AnyThreadKind<Record, Ending>,
  records: Record[],
  record: Record,
  text: string,
): boolean {
  const open = records.filter((candidate) => candidate === record || kind.endingOf(candidate) === null);
  const found = findSubject(`${kind.textOf(record)}: ${oneLine(text)}`, open, (candidate) => kind.textOf(candidate));
  return found !== null && found.candidate !== record;
}
