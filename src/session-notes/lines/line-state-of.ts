import type { Campaign, Source, SourcedText } from "../../campaign/campaign";
import type { ThreadRecord } from "../../campaign/thread-kind";
import type { FollowUpName } from "../../kinds/follow-up-name";
import type { LineState } from "../../views/threads/line-state";
import type { ShownThreadKind } from "../../views/threads/shown-thread-kind";
import { SHOWN_THREAD_KINDS } from "../../views/threads/shown-thread-kinds";
import { threadStateOf } from "../../views/threads/thread-state";

type ReadState = (campaign: Campaign, source: Source) => LineState | null;

const GONE: LineState = { sign: "✕", label: "Gone", struck: true };

function isAt(written: Source, source: Source): boolean {
  return written.path === source.path && written.line === source.line;
}

function threadStateReader<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  shown: ShownThreadKind<Thread, Ending, EndingName>,
): ReadState {
  return (campaign, source) => {
    const thread = shown.threadsOf(campaign).find((candidate) => isAt(candidate.source, source));
    if (thread === undefined) return null;
    return threadStateOf(shown, thread);
  };
}

function goneItem(campaign: Campaign, source: Source): LineState | null {
  const item = campaign.items.find((candidate) => isAt(candidate.source, source));
  if (item === undefined || item.gone === null) return null;
  return GONE;
}

const STATE_READERS: ReadState[] = [...SHOWN_THREAD_KINDS.map(threadStateReader), goneItem];

export function lineStateOf(campaign: Campaign, source: Source): LineState | null {
  for (const read of STATE_READERS) {
    const state = read(campaign, source);
    if (state !== null) return state;
  }
  return null;
}
