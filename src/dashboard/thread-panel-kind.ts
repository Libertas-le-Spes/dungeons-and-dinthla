import type { Source, SourcedText } from "../campaign/campaign";
import type { ThreadRecord } from "../campaign/thread-kind";
import type { FollowUpName } from "../kinds/follow-up-name";
import type { ShownThreadKind } from "../views/shown-thread-kind";
import type { ThreadPanelActions } from "./thread-panel-actions";

export interface ThreadPanelKind<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName> {
  shown: ShownThreadKind<Thread, Ending, EndingName>;
  title: string;
  linkText: string;
  countWord: string;
  noneText: string;
  show(actions: ThreadPanelActions): void;
  open(actions: ThreadPanelActions, source: Source, onClosed: (changed: boolean) => void): void;
}
