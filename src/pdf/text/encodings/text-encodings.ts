import { PdfDocTextEncoding } from "./pdf-doc-text-encoding";
import { RefusedEncoding } from "./refused-encoding";
import type { TextEncoding } from "./text-encoding";
import { Utf16BigEndianEncoding } from "./utf16-big-endian-encoding";

export const TEXT_ENCODINGS: readonly TextEncoding[] = [new Utf16BigEndianEncoding(), new RefusedEncoding([0xff, 0xfe]), new RefusedEncoding([0xef, 0xbb, 0xbf]), new PdfDocTextEncoding()];
