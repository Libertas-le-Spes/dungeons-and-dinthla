import type { TFile } from "obsidian";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { changesNothing, importChangesOf, type TypedText } from "../changes/import-changes";
import { sameTypedText } from "../changes/same-typed-text";
import { refuseUnlessOnlyTheImportChanged } from "./guarding/read-back";
import { changedSinceRead, typedTextNotShown } from "./guarding/refusals";
import { importedNoteText } from "./rewriting/imported-note";
import type { NoteFiles } from "./note-files";

export function checkedTextOf(before: string, sheet: PrintedSheet, today: string, shown: readonly TypedText[]): string {
  const after = importedNoteText(before, sheet, today);
  refuseUnlessOnlyTheImportChanged(before, after);
  const changes = importChangesOf(before, after);
  if (!sameTypedText(shown, changes.typed)) throw typedTextNotShown();
  if (changesNothing(changes)) return before;
  return after;
}

export async function writeWhenUnchangedSinceRead(files: NoteFiles, file: TFile, before: string, after: string): Promise<void> {
  let refusal: unknown = null;
  await files.process(file, function change(current: string): string {
    if (current === before) return after;
    refusal = changedSinceRead();
    return current;
  });
  if (refusal !== null) throw refusal;
}

export function checkedNewNoteText(sheet: PrintedSheet, today: string): string {
  return checkedTextOf("", sheet, today, []);
}
