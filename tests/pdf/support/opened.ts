import { openDocument, type OpenDocument } from "../../../src/pdf/open-document";
import { testParts } from "../writer/zlib-chunks";

export function opened(bytes: Uint8Array): Promise<OpenDocument> {
  return openDocument(bytes, testParts());
}
