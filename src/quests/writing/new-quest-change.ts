import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { Character } from "../../characters/reading/characters";
import type { RecordChange } from "../../campaign/changes/record-change";
import { notHidden } from "../../campaign/changes/hidden-refusal";
import { linesAddedTo } from "../../campaign/changes/session-change";
import { verdictOf, writeNothingWhen } from "../../campaign/changes/verdict";
import { planNewQuest, refusalForNewQuest, type NewQuest, type NewQuestPlan } from "./new-quest";

export function newQuest(store: Pick<CampaignStore, "current" | "sessionNotes">, entry: NewQuest, characters: Character[], sessionPath: string): RecordChange<NewQuestPlan> {
  const addedLine = (plan: NewQuestPlan) => linesAddedTo(sessionPath, [plan.line]);
  return {
    plan: () => planNewQuest(entry, characters),
    checks: [
      (plan) => writeNothingWhen(plan.title === ""),
      (plan) => verdictOf(refusalForNewQuest(store.current.quests, plan)),
      notHidden(() => store.sessionNotes, addedLine),
    ],
    sessionChangeOf: addedLine,
  };
}
