import { readPdfFieldsWith } from "../../../src/pdf/read-pdf-fields";
import type { ReaderParts } from "../../../src/pdf/reader-parts";
import type { FieldValue } from "../../../src/pdf/fields/field-value";
import { testParts } from "../writer/zlib-chunks";

export async function refusalOf(bytes: Uint8Array, parts: ReaderParts = testParts()): Promise<string> {
  const result = await readPdfFieldsWith(bytes, parts);
  if (result.ok) return "";
  return result.reason;
}

export async function fieldsOf(bytes: Uint8Array, parts: ReaderParts = testParts()): Promise<Record<string, FieldValue>> {
  const result = await readPdfFieldsWith(bytes, parts);
  if (!result.ok) throw new Error(`The made-up PDF was refused: ${result.reason}`);
  return Object.fromEntries(result.fields);
}
