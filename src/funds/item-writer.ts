import { buildCampaign } from "../campaign/build-campaign";
import type { Campaign, ItemRecord, SessionNote } from "../campaign/campaign";
import { CHANGED_IN_NOTE, NoteEditor, type EditorFiles } from "../campaign/note-editor";
import { sessionNoteOf } from "../campaign/session-file";
import { initialItemEdit, planItemSave, refusalForItemPlan, type ItemEdit, type ItemPlan } from "./item-plan";

export interface ItemSource {
  readonly current: Campaign;
  readonly sessionNotes: SessionNote[];
}

export interface OpenedItem {
  edit: ItemEdit;
  save(edit: ItemEdit): Promise<boolean>;
}

function writesNothing(plan: ItemPlan): boolean {
  return plan.added.length === 0 && plan.removal === null && plan.rewrite === null;
}

function sameItem(items: ItemRecord[], item: ItemRecord): boolean {
  const now = items.find((candidate) => candidate.name === item.name);
  return JSON.stringify(now) === JSON.stringify(item);
}

async function readAgain(files: EditorFiles, sessions: SessionNote[]): Promise<SessionNote[] | null> {
  const fresh: SessionNote[] = [];
  for (const session of sessions) {
    const file = files.getFileByPath(session.path);
    if (file === null) return null;
    fresh.push(sessionNoteOf(session.path, session.number, await files.read(file)));
  }
  return fresh;
}

async function readsAsOpened(files: EditorFiles, store: ItemSource, sessions: SessionNote[], item: ItemRecord): Promise<boolean> {
  if (!sameItem(store.current.items, item)) return false;
  const fresh = await readAgain(files, sessions);
  if (fresh === null) return false;
  return sameItem(buildCampaign(fresh).items, item);
}

export function openedItem(files: EditorFiles, store: ItemSource, item: ItemRecord, sessionPath: string): OpenedItem {
  const editor = new NoteEditor(files);
  const sessions = store.sessionNotes;
  const coins = store.current.coins;
  return {
    edit: initialItemEdit(item, sessions),
    save: async (edit) => {
      const plan = planItemSave(item, edit, sessions, coins, sessionPath);
      if ("error" in plan) throw new Error(plan.error);
      if (writesNothing(plan)) return false;
      if (!(await readsAsOpened(files, store, sessions, item))) throw new Error(CHANGED_IN_NOTE);
      const refusal = refusalForItemPlan(sessions, item, plan);
      if (refusal !== null) throw new Error(refusal);
      if (plan.rewrite !== null) return editor.rewrite(plan.rewrite.old, plan.rewrite.line);
      if (plan.removal === null) return editor.append(plan.targetPath, plan.added);
      return editor.replace(plan.targetPath, plan.added, plan.removal);
    },
  };
}
