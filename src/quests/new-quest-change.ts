import type { CampaignStore } from "../campaign/campaign-store";
import type { Character } from "../campaign/characters";
import type { RecordChange } from "../campaign/record-change";
import { verdictOf, writeNothingWhen } from "../campaign/verdict";
import { planNewQuest, refusalForNewQuest, type NewQuest, type NewQuestPlan } from "./new-quest";
import type { QuestWriter } from "./quest-writer";

export function newQuestAdd(store: Pick<CampaignStore, "current">, entry: NewQuest, characters: Character[], sessionPath: string, writer: QuestWriter): RecordChange<NewQuestPlan> {
  return {
    plan: () => planNewQuest(entry, characters),
    checks: [(plan) => writeNothingWhen(plan.title === ""), (plan) => verdictOf(refusalForNewQuest(store.current.quests, plan))],
    writePlan: (plan) => writer.add(plan.line, sessionPath),
  };
}
