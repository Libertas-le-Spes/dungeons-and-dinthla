import type { FollowUpName } from "../kinds/follow-up-name";
import type { TrackedKind } from "../kinds/tracked-kind";
import type { Source, SourcedText } from "./campaign";

export interface ThreadRecord {
  source: Source;
}

export interface ThreadKind<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName> {
  tracked: TrackedKind;
  addingName: FollowUpName;
  endingNames: readonly EndingName[];
  readOpening(body: string, source: Source): Thread | null;
  isOpeningLine(written: string, text: string): boolean;
  textOf(thread: Thread): string;
  additionsOf(thread: Thread): SourcedText[];
  endingOf(thread: Thread): Ending | null;
  endingNameOf(ending: Ending): EndingName;
  end(thread: Thread, name: EndingName, ending: SourcedText): void;
}
