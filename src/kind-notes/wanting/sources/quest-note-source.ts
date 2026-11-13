import type { Campaign, QuestRecord, Source } from "../../../campaign/record/campaign";
import { questTrackedKind } from "../../../kinds/quest-tracked-kind";
import type { KindNoteSource } from "./kind-note-source";
import { unmatchedSourcesOf } from "./unmatched-sources";

function sourcesOfQuest(quest: QuestRecord): Source[] {
  const sources = [quest.source];
  for (const line of quest.progress) sources.push(line.source);
  if (quest.outcome !== null) sources.push(quest.outcome.source);
  return sources;
}

export const questNoteSource: KindNoteSource = {
  kind: questTrackedKind,
  sourcesOf(campaign: Campaign): Source[] {
    const sources = campaign.quests.flatMap(sourcesOfQuest);
    return [...sources, ...unmatchedSourcesOf(campaign, questTrackedKind)];
  },
};
