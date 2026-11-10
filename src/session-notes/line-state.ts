import type { Campaign, Source, SourcedText } from "../campaign/campaign";
import type { ThreadRecord } from "../campaign/thread-kind";
import type { FollowUpName } from "../kinds/follow-up-name";
import { questionShownKind } from "../questions/question-shown-kind";
import { questShownKind } from "../quests/quest-shown-kind";
import type { LineState } from "../views/line-state";
import type { ShownThreadKind } from "../views/shown-thread-kind";
import { threadStateOf } from "../views/thread-state";

type ReadState = (campaign: Campaign, source: Source) => LineState | null;

const GONE: LineState = { sign: "✕", label: "Gone", struck: true };

function isAt(written: Source, source: Source): boolean {
  return written.path === source.path && written.line === source.line;
}

function threadStateAt<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
  shown: ShownThreadKind<Thread, Ending, EndingName>,
  campaign: Campaign,
  source: Source,
): LineState | null {
  const thread = shown.threadsOf(campaign).find((candidate) => isAt(candidate.source, source));
  if (thread === undefined) return null;
  return threadStateOf(shown, thread);
}

function questionState(campaign: Campaign, source: Source): LineState | null {
  return threadStateAt(questionShownKind, campaign, source);
}

function questState(campaign: Campaign, source: Source): LineState | null {
  return threadStateAt(questShownKind, campaign, source);
}

function goneItem(campaign: Campaign, source: Source): LineState | null {
  const item = campaign.items.find((candidate) => isAt(candidate.source, source));
  if (item === undefined || item.gone === null) return null;
  return GONE;
}

const STATE_READERS: ReadState[] = [questionState, questState, goneItem];

export function lineStateOf(campaign: Campaign, source: Source): LineState | null {
  for (const read of STATE_READERS) {
    const state = read(campaign, source);
    if (state !== null) return state;
  }
  return null;
}
