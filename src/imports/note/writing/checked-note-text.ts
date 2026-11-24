import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { changesNothing, importChangesOf, type TypedText } from "../changes/import-changes";
import { sameTypedText } from "../changes/same-typed-text";
import { refuseUnlessOnlyTheImportChanged } from "./guarding/read-back";
import { changedSinceRead, typedTextNotShown } from "./guarding/refusals";
import type { ImportStamp } from "../properties/import-stamp";
import { importedNoteText } from "./rewriting/imported-note";
import type { NoteFiles } from "./note-files";
import type { NoteRef } from "../../../host/notes/note-ref";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

export interface CheckedText {
  before: string;
  sheet: PrintedSheet;
  stamp: ImportStamp;
  shown: readonly TypedText[];
}

export function checkedTextOf({ before, sheet, stamp, shown }: CheckedText, syntax: PropertiesSyntax): string {
  const after = importedNoteText({ current: before, sheet, stamp }, syntax);
  refuseUnlessOnlyTheImportChanged(before, after, syntax);
  const changes = importChangesOf(before, after, syntax);
  if (!sameTypedText(shown, changes.typed)) throw typedTextNotShown();
  if (changesNothing(changes)) return before;
  return after;
}

export async function writeWhenUnchangedSinceRead(files: NoteFiles, file: NoteRef, before: string, after: string): Promise<void> {
  let refusal: unknown = null;
  await files.change(file, function change(current: string): string {
    if (current === before) return after;
    refusal = changedSinceRead();
    return current;
  });
  if (refusal !== null) throw refusal;
}

export function checkedNewNoteText(sheet: PrintedSheet, stamp: ImportStamp, syntax: PropertiesSyntax): string {
  return checkedTextOf({ before: "", sheet, stamp, shown: [] }, syntax);
}
