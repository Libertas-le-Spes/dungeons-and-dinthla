import type { Campaign, Source, SourcedText } from "../../campaign/campaign";
import type { ThreadKind, ThreadRecord } from "../../campaign/thread-kind";
import type { FollowUpName } from "../../kinds/follow-up-name";
import type { ThreadFact } from "./thread-fact";
import type { EndedLook, ThreadLook } from "./thread-look";
import type { ThreadOpeners } from "./thread-openers";

export interface ThreadListWords {
  itemName: string;
  openWord: string;
  foldedWord: string;
  emptyHint: string;
}

export interface ThreadPanelWords {
  title: string;
  link: string;
  noneOpen: string;
}

export interface ShownThreadKind<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName> {
  threadKind: ThreadKind<Thread, Ending, EndingName>;
  threadsOf(campaign: Campaign): Thread[];
  listWords: ThreadListWords;
  panelWords: ThreadPanelWords;
  openLook: ThreadLook;
  endedLookOf(ending: Ending): EndedLook;
  factsOf(thread: Thread): ThreadFact[];
  show(openers: ThreadOpeners): void;
  open(openers: ThreadOpeners, source: Source, onClosed: (changed: boolean) => void): void;
}
