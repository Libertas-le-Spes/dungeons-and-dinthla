import type { QuestRecord } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import type { RecordChange } from "../campaign/record-change";
import { refusedWhen, verdictOf } from "../campaign/verdict";
import { GOES_ELSEWHERE, happenedWouldGoElsewhere } from "./current-quest";
import { planQuestSave, refusalForQuestPlan, type QuestEdit, type QuestPlan } from "./quest-plan";
import type { QuestWriter } from "./quest-writer";

type QuestStore = Pick<CampaignStore, "current" | "sessionNotes">;

export function questSave(store: QuestStore, record: QuestRecord, edit: QuestEdit, sessionPath: string, writer: QuestWriter): RecordChange<QuestPlan> {
  return {
    plan: () => planQuestSave(record, edit, store.current.coins, sessionPath),
    checks: [
      () => refusedWhen(happenedWouldGoElsewhere(store.current.quests, record, edit.happened), GOES_ELSEWHERE),
      (plan) => verdictOf(refusalForQuestPlan(store.sessionNotes, record, plan)),
    ],
    writePlan: (plan) => writer.apply(plan),
  };
}
