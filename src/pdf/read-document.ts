import { readFields } from "./fields/read-fields";
import type { FieldValue } from "./fields/field-value";
import { openDocument } from "./open-document";
import type { ReaderParts } from "./reader-parts";

export async function readDocument(bytes: Uint8Array, parts: ReaderParts): Promise<ReadonlyMap<string, FieldValue>> {
  const document = await openDocument(bytes, parts);
  return readFields(document.catalog, document.store);
}
