import type { ItemRecord } from "../../campaign/campaign";
import type { EditorFiles } from "../../campaign/note-editor";
import { SessionChangeWriter } from "../../campaign/session-change-writer";
import { writeRecordChange } from "../../campaign/write-record-change";
import { itemSave } from "./item-save";
import { initialItemEdit, type ItemEdit } from "./item-plan";
import type { ItemSource } from "./item-source";

export interface OpenedItem {
  edit: ItemEdit;
  save(edit: ItemEdit): Promise<boolean>;
}

export function openedItem(files: EditorFiles, store: ItemSource, item: ItemRecord, sessionPath: string): OpenedItem {
  const writer = new SessionChangeWriter(files);
  const asOpened = { files, store, sessions: store.sessionNotes, coins: store.current.coins };
  return {
    edit: initialItemEdit(item, asOpened.sessions),
    save: async (edit) => writeRecordChange(itemSave(asOpened, item, edit, sessionPath), writer),
  };
}
