import { padded } from "./object-bytes";
import { PdfOutput } from "./pdf-output";
import { PdfWriter } from "./pdf-writer";

export interface ClassicOptions {
  root: number;
  trailerExtra: string;
  junkBefore: string;
  startxrefText: string;
  tableText: string;
  size: number;
}

export const HEADER = "%PDF-1.7\n%\xe2\xe3\xcf\xd3\n";

function entryLine(offset: number | undefined): string {
  if (offset === undefined) return "0000000000 00000 f \n";
  return `${padded(offset, 10)} 00000 n \n`;
}

function tableOf(size: number, offsets: Map<number, number>): string {
  let table = `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (let number = 1; number < size; number += 1) table += entryLine(offsets.get(number));
  return table;
}

function chosenTable(options: ClassicOptions, offsets: Map<number, number>): string {
  if (options.tableText !== "") return options.tableText;
  return tableOf(options.size, offsets);
}

function chosenStartxref(options: ClassicOptions, tableOffset: number): string {
  if (options.startxrefText !== "") return options.startxrefText;
  return String(tableOffset);
}

export function classicPdf(writer: PdfWriter, given: Partial<ClassicOptions> = {}): Buffer {
  const options: ClassicOptions = { root: 1, trailerExtra: "", junkBefore: "", startxrefText: "", tableText: "", size: writer.highestNumber() + 1, ...given };
  const output = new PdfOutput();
  output.put(options.junkBefore);
  output.startFileHere();
  output.put(HEADER);
  const offsets = new Map<number, number>();
  for (const number of writer.numbers()) {
    offsets.set(number, output.put(`${number} 0 obj\n`));
    output.put(writer.bodyOf(number));
    output.put("\nendobj\n");
  }
  const tableOffset = output.put(chosenTable(options, offsets));
  output.put(`trailer\n<< /Size ${options.size} /Root ${options.root} 0 R ${options.trailerExtra} >>\n`);
  output.put(`startxref\n${chosenStartxref(options, tableOffset)}\n%%EOF\n`);
  return output.toBuffer();
}
