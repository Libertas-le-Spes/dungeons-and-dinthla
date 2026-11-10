import type { CoinRecord, ItemRecord, SessionNote } from "../campaign/campaign";
import { CHANGED_IN_NOTE, type EditorFiles } from "../campaign/note-editor";
import type { RecordChange } from "../campaign/record-change";
import type { SessionChangeWriter } from "../campaign/session-change-writer";
import { refusedWhen, verdictOf, writeNothingWhen } from "../campaign/verdict";
import { planItemSave, refusalForItemPlan, type ItemEdit, type ItemPlan } from "./item-plan";
import { itemSessionChange } from "./item-session-change";
import type { ItemSource } from "./item-writer";
import { readsAsOpened } from "./reads-as-opened";

export interface OpenedItemNotes {
  files: EditorFiles;
  store: ItemSource;
  sessions: SessionNote[];
  coins: CoinRecord[];
}

function writesNothing(plan: ItemPlan): boolean {
  return plan.added.length === 0 && plan.removal === null && plan.rewrite === null;
}

export function itemSave(notes: OpenedItemNotes, item: ItemRecord, edit: ItemEdit, sessionPath: string, writer: SessionChangeWriter): RecordChange<ItemPlan> {
  return {
    plan: () => {
      const plan = planItemSave(item, edit, notes.sessions, notes.coins, sessionPath);
      if ("error" in plan) return { refused: plan.error };
      return plan;
    },
    checks: [
      (plan) => writeNothingWhen(writesNothing(plan)),
      async () => refusedWhen(!(await readsAsOpened(notes.files, notes.store, notes.sessions, item)), CHANGED_IN_NOTE),
      (plan) => verdictOf(refusalForItemPlan(notes.sessions, item, plan)),
    ],
    writePlan: (plan) => writer.apply(itemSessionChange(plan)),
  };
}
