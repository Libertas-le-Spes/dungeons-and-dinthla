import type { Campaign, QuestStatus, Source } from "../campaign/campaign";

export interface LineState {
  sign: string;
  label: string;
  struck: boolean;
}

type ReadState = (campaign: Campaign, source: Source) => LineState | null;

const ANSWERED: LineState = { sign: "✓", label: "Answered", struck: false };
const GONE: LineState = { sign: "✕", label: "Gone", struck: true };
const QUEST_STATES: Record<QuestStatus, LineState> = {
  completed: { sign: "✓", label: "Completed", struck: false },
  failed: { sign: "✕", label: "Abandoned", struck: true },
};

function isAt(written: Source, source: Source): boolean {
  return written.path === source.path && written.line === source.line;
}

function answeredQuestion(campaign: Campaign, source: Source): LineState | null {
  const question = campaign.questions.find((candidate) => isAt(candidate.source, source));
  if (question === undefined || question.closing === null) return null;
  return ANSWERED;
}

function finishedQuest(campaign: Campaign, source: Source): LineState | null {
  const quest = campaign.quests.find((candidate) => isAt(candidate.source, source));
  if (quest === undefined || quest.closing === null) return null;
  return QUEST_STATES[quest.closing.status];
}

function goneItem(campaign: Campaign, source: Source): LineState | null {
  const item = campaign.items.find((candidate) => isAt(candidate.source, source));
  if (item === undefined || item.gone === null) return null;
  return GONE;
}

const STATE_READERS: ReadState[] = [answeredQuestion, finishedQuest, goneItem];

export function lineStateOf(campaign: Campaign, source: Source): LineState | null {
  for (const read of STATE_READERS) {
    const state = read(campaign, source);
    if (state !== null) return state;
  }
  return null;
}
