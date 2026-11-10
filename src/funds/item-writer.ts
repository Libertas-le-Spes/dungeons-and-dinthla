import type { Campaign, ItemRecord, SessionNote } from "../campaign/campaign";
import type { EditorFiles } from "../campaign/note-editor";
import { SessionChangeWriter } from "../campaign/session-change-writer";
import { writeRecordChange } from "../campaign/write-record-change";
import { itemSave } from "./item-change";
import { initialItemEdit, type ItemEdit } from "./item-plan";

export interface ItemSource {
  readonly current: Campaign;
  readonly sessionNotes: SessionNote[];
}

export interface OpenedItem {
  edit: ItemEdit;
  save(edit: ItemEdit): Promise<boolean>;
}

export function openedItem(files: EditorFiles, store: ItemSource, item: ItemRecord, sessionPath: string): OpenedItem {
  const writer = new SessionChangeWriter(files);
  const notes = { files, store, sessions: store.sessionNotes, coins: store.current.coins };
  return {
    edit: initialItemEdit(item, notes.sessions),
    save: async (edit) => writeRecordChange(itemSave(notes, item, edit, sessionPath, writer)),
  };
}
