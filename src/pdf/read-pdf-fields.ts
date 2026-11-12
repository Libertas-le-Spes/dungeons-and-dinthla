import { PLATFORM_PARTS, type ReaderParts } from "./reader-parts";
import type { PdfReadResult } from "./pdf-read-result";
import { PdfRefusal } from "./refusals/pdf-refusal";
import { readDocument } from "./read-document";

const UNEXPECTED = "Something went wrong while reading this file, so it was not read.";

function refusalWords(error: unknown): string {
  if (error instanceof PdfRefusal) return error.reason;
  return UNEXPECTED;
}

export async function readPdfFieldsWith(bytes: Uint8Array, parts: ReaderParts): Promise<PdfReadResult> {
  try {
    return { ok: true, fields: await readDocument(bytes, parts) };
  } catch (error) {
    return { ok: false, reason: refusalWords(error) };
  }
}

export function readPdfFields(bytes: Uint8Array): Promise<PdfReadResult> {
  return readPdfFieldsWith(bytes, PLATFORM_PARTS);
}
