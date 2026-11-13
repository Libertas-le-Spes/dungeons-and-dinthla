import type { TFile } from "obsidian";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { changesNothing, importChangesOf } from "../changes/import-changes";
import type { NoteFiles } from "./note-files";
import { importedNoteText } from "./imported-note";
import { refuseUnlessOnlyTheImportChanged } from "./read-back";

function checkedTextOf(before: string, sheet: PrintedSheet, today: string): string {
  const after = importedNoteText(before, sheet, today);
  refuseUnlessOnlyTheImportChanged(before, after);
  if (changesNothing(importChangesOf(before, after))) return before;
  return after;
}

export async function writeCheckedImport(files: NoteFiles, file: TFile, sheet: PrintedSheet, today: string): Promise<void> {
  let refusal: unknown = null;
  await files.process(file, function change(before: string): string {
    try {
      return checkedTextOf(before, sheet, today);
    } catch (error) {
      refusal = error;
      return before;
    }
  });
  if (refusal !== null) throw refusal;
}

export function checkedNewNoteText(sheet: PrintedSheet, today: string): string {
  return checkedTextOf("", sheet, today);
}
