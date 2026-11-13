import { PdfRefusal } from "../../refusals/pdf-refusal";
import type { InflatedChunks } from "./inflated-chunks";
import { ReaderChunks } from "./reader-chunks";

export function startPlatformInflating(compressed: Uint8Array): InflatedChunks {
  if (typeof DecompressionStream === "undefined") throw new PdfRefusal("This device can't read PDFs, so the file was not read.");
  const packed = new Blob([new Uint8Array(compressed)]).stream();
  const unpacked = packed.pipeThrough(new DecompressionStream("deflate"));
  return new ReaderChunks(unpacked.getReader());
}
