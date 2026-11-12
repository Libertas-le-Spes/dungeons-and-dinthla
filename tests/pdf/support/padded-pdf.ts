import { classicPdf } from "../writer/layouts/classic-layout";
import { FormDocument } from "../writer/documents/form-document";
import { literal } from "../writer/pdf-text";

const FILLER = 90;

function withFiller(size: number): Buffer {
  const writer = new FormDocument().text("Primary Name", literal("Aria")).writer();
  writer.stream(FILLER, "", Buffer.alloc(size, 32), String(size));
  return classicPdf(writer);
}

export function pdfOfExactly(total: number): Buffer {
  const base = withFiller(0).length;
  let size = total - base;
  for (let round = 0; round < 4; round += 1) size += total - withFiller(size).length;
  return withFiller(size);
}
