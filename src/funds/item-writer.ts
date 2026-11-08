import type { Campaign, SessionNote } from "../campaign/campaign";
import { CHANGED_IN_NOTE, NoteEditor, type EditorVault } from "../campaign/note-editor";
import { planItemSave, refusalForItemPlan, type ItemEdit } from "./item-plan";

export interface ItemSource {
  readonly current: Campaign;
  readonly sessionNotes: SessionNote[];
}

export function itemSaver(vault: EditorVault, store: ItemSource, name: string, sessionPath: string): (edit: ItemEdit) => Promise<boolean> {
  const editor = new NoteEditor(vault);
  return async (edit) => {
    const item = store.current.items.find((candidate) => candidate.name === name);
    if (item === undefined) throw new Error(CHANGED_IN_NOTE);
    const plan = planItemSave(item, edit, store.sessionNotes, store.current.coins, sessionPath);
    if ("error" in plan) throw new Error(plan.error);
    const refusal = refusalForItemPlan(store.sessionNotes, item, plan);
    if (refusal !== null) throw new Error(refusal);
    if (plan.removal === null) return editor.append(plan.targetPath, plan.added);
    return editor.replace(plan.targetPath, plan.added, plan.removal);
  };
}
