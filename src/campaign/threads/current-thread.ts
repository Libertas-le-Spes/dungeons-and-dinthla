import { CHANGED_IN_NOTE } from "../writing/note-editor";

export function currentThread<Record>(records: Record[], opened: Record, isSame: (current: Record, opened: Record) => boolean): Record {
  const current = records.find((record) => isSame(record, opened));
  if (current === undefined) throw new Error(CHANGED_IN_NOTE);
  return current;
}
