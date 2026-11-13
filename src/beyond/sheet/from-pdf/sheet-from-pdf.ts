import { readPdfFields } from "../../../pdf/read-pdf-fields";
import { MAX_FILE_BYTES } from "../../../pdf/limits/pdf-limits";
import { Refusal } from "../../shape/refusal";
import type { PrintedSheet } from "../printed-sheet";
import { readPrintedSheet } from "../read-printed-sheet";

export const MOST_PDF_BYTES = MAX_FILE_BYTES;

export const SHEET_NOT_READ = "Something went wrong while reading the sheet in this file, so nothing was read.";

export interface SheetRead {
  readonly ok: true;
  readonly sheet: PrintedSheet;
}

export interface SheetRefused {
  readonly ok: false;
  readonly reason: string;
}

export type SheetFromPdf = SheetRead | SheetRefused;

function refusedWith(reason: string): SheetRefused {
  return { ok: false, reason };
}

function reasonOf(error: unknown): string {
  if (error instanceof Refusal) return error.message;
  return SHEET_NOT_READ;
}

export async function sheetFromPdf(bytes: Uint8Array): Promise<SheetFromPdf> {
  const read = await readPdfFields(bytes);
  if (!read.ok) return refusedWith(read.reason);
  try {
    return { ok: true, sheet: readPrintedSheet(read.fields) };
  } catch (error) {
    return refusedWith(reasonOf(error));
  }
}
