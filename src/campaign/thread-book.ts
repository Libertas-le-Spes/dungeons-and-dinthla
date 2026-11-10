import type { FollowUpName } from "../kinds/follow-up-name";
import type { MarkerName } from "../kinds/marker-name";
import type { FollowUp } from "../notes/follow-up";
import type { Source, SourcedText } from "./campaign";
import { findSubject } from "./subject";
import type { ThreadKind, ThreadRecord } from "./thread-kind";

export class ThreadBook<Record extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName> {
  readonly records: Record[] = [];

  constructor(private readonly kind: ThreadKind<Record, Ending, EndingName>) {}

  addOpening(marker: MarkerName | null, body: string, source: Source): void {
    if (marker !== this.kind.tracked.marker.name) return;
    const record = this.kind.readOpening(body, source);
    if (record !== null) this.records.push(record);
  }

  addFollowUp(followUp: FollowUp, source: Source): boolean {
    const ending = this.kind.endingNames.find((name) => name === followUp.kind);
    if (ending === undefined && followUp.kind !== this.kind.addingName) return false;
    const open = this.records.filter((record) => this.kind.endingOf(record) === null);
    const found = findSubject(followUp.text, open, (record) => this.kind.textOf(record));
    if (found === null) return false;
    const line = { text: found.rest, source };
    if (ending === undefined) this.kind.additionsOf(found.candidate).push(line);
    else this.kind.end(found.candidate, ending, line);
    return true;
  }
}
