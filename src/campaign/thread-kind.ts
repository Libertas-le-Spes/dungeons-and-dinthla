import type { FollowUpName } from "../kinds/follow-up-name";
import type { TrackedKind } from "../kinds/tracked-kind";
import type { Source, SourcedText } from "./campaign";

export interface ThreadRecord {
  source: Source;
}

export interface ThreadKind<Record extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName> {
  tracked: TrackedKind;
  addingName: FollowUpName;
  endingNames: readonly EndingName[];
  readOpening(body: string, source: Source): Record | null;
  isOpeningLine(written: string, text: string): boolean;
  textOf(record: Record): string;
  additionsOf(record: Record): SourcedText[];
  endingOf(record: Record): Ending | null;
  endingNameOf(ending: Ending): FollowUpName;
  end(record: Record, name: EndingName, ending: SourcedText): void;
}

export type AnyThreadKind<Record extends ThreadRecord, Ending extends SourcedText> = ThreadKind<Record, Ending, FollowUpName>;
