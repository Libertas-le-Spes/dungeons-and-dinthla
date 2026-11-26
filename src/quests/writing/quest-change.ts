import type { QuestRecord } from "../../campaign/record/campaign";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { RecordChange } from "../../campaign/changes/record-change";
import { refusedWhen, verdictOf } from "../../campaign/changes/verdict";
import { GOES_ELSEWHERE, happenedWouldGoElsewhere } from "./current-quest";
import { planQuestSave, refusalForQuestPlan, type QuestEdit, type QuestPlan } from "./quest-plan";
import { questSessionChange } from "./quest-session-change";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

type QuestStore = Pick<CampaignStore, "current" | "sessionNotes">;

export function questSave(store: QuestStore, record: QuestRecord, edit: QuestEdit, sessionPath: string, syntax: PropertiesSyntax): RecordChange<QuestPlan> {
  return {
    plan: () => planQuestSave(record, edit, store.current.coins, sessionPath),
    checks: [
      () => refusedWhen(happenedWouldGoElsewhere(store.current.quests, record, edit.happened), GOES_ELSEWHERE),
      (plan) => verdictOf(refusalForQuestPlan(store.sessionNotes, record, plan, syntax)),
    ],
    sessionChangeOf: questSessionChange,
  };
}
