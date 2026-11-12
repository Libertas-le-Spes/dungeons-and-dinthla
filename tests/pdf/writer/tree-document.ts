import { classicPdf } from "./classic-layout";
import { PdfWriter } from "./pdf-writer";

export interface TreeOptions {
  objects: Record<number, string>;
  annotations: number[];
  formFields: number[] | null;
  pageExtra: string;
  catalogExtra: string;
  formExtra: string;
}

function referencesTo(numbers: number[]): string {
  const references: string[] = [];
  for (const number of numbers) references.push(`${number} 0 R`);
  return references.join(" ");
}

function formEntry(options: TreeOptions): string {
  if (options.formFields === null) return "";
  return `/AcroForm << /Fields [${referencesTo(options.formFields)}] ${options.formExtra} >>`;
}

export function treeWriter(given: Partial<TreeOptions>): PdfWriter {
  const options: TreeOptions = { objects: {}, annotations: [], formFields: null, pageExtra: "", catalogExtra: "", formExtra: "", ...given };
  const writer = new PdfWriter();
  writer.set(1, `<< /Type /Catalog /Pages 2 0 R ${formEntry(options)} ${options.catalogExtra} >>`);
  writer.set(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  writer.set(3, `<< /Type /Page /Parent 2 0 R /Annots [${referencesTo(options.annotations)}] ${options.pageExtra} >>`);
  for (const [number, body] of Object.entries(options.objects)) writer.set(Number(number), body);
  return writer;
}

export function treeDocument(given: Partial<TreeOptions>): Buffer {
  return classicPdf(treeWriter(given));
}
