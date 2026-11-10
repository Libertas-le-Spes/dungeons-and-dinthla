import type { Campaign, SourcedText } from "../campaign/campaign";
import type { ThreadKind, ThreadRecord } from "../campaign/thread-kind";
import type { FollowUpName } from "../kinds/follow-up-name";
import type { LineState } from "./line-state";

export interface ThreadFact {
  name: string;
  value: string;
}

export interface ShownThreadKind<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName> {
  kind: ThreadKind<Thread, Ending, EndingName>;
  threadsOf(campaign: Campaign): Thread[];
  markClass: string;
  factsOf(thread: Thread): ThreadFact[];
  stateOf(ending: Ending): LineState;
  showsStateInMeta: boolean;
}
