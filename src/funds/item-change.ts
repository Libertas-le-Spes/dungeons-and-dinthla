import type { CoinRecord, ItemRecord, SessionNote } from "../campaign/campaign";
import { CHANGED_IN_NOTE, type EditorFiles } from "../campaign/note-editor";
import type { RecordChange } from "../campaign/record-change";
import { refusedWhen, verdictOf, writeNothingWhen } from "../campaign/verdict";
import { planItemSave, refusalForItemPlan, type ItemEdit, type ItemPlan } from "./item-plan";
import { itemSessionChange } from "./item-session-change";
import type { ItemSource } from "./item-source";
import { readsAsOpened } from "./reads-as-opened";

export interface ItemAsOpened {
  files: EditorFiles;
  store: ItemSource;
  sessions: SessionNote[];
  coins: CoinRecord[];
}

function writesNothing(plan: ItemPlan): boolean {
  return plan.added.length === 0 && plan.removal === null && plan.rewrite === null;
}

export function itemSave(asOpened: ItemAsOpened, item: ItemRecord, edit: ItemEdit, sessionPath: string): RecordChange<ItemPlan> {
  return {
    plan: () => planItemSave(item, edit, asOpened.sessions, asOpened.coins, sessionPath),
    checks: [
      (plan) => writeNothingWhen(writesNothing(plan)),
      async () => refusedWhen(!(await readsAsOpened(asOpened.files, asOpened.store, asOpened.sessions, item)), CHANGED_IN_NOTE),
      (plan) => verdictOf(refusalForItemPlan(asOpened.sessions, item, plan)),
    ],
    sessionChangeOf: itemSessionChange,
  };
}
