import { classicPdf, type ClassicOptions } from "../layouts/classic-layout";
import { PdfWriter } from "../pdf-writer";
import { streamedPdf, type StreamedOptions } from "../layouts/streamed-layout";

export interface FormOptions {
  acroForm: boolean;
  catalogExtra: string;
  pageExtra: string;
  formExtra: string;
  extraAnnotations: number[];
}

export const FIRST_FIELD_NUMBER = 10;
const CATALOG = 1;
const PAGES = 2;
const PAGE = 3;

interface FieldSpec {
  name: string;
  type: string;
  value: string;
  extra: string;
}

export class FormDocument {
  private readonly options: FormOptions;
  private readonly fields: FieldSpec[] = [];

  constructor(given: Partial<FormOptions> = {}) {
    this.options = { acroForm: false, catalogExtra: "", pageExtra: "", formExtra: "", extraAnnotations: [], ...given };
  }

  text(name: string, value: string, extra = ""): this {
    return this.field(name, "Tx", value, extra);
  }

  check(name: string, value: string, extra = ""): this {
    return this.field(name, "Btn", value, extra);
  }

  choice(name: string, value: string, extra = ""): this {
    return this.field(name, "Ch", value, extra);
  }

  field(name: string, type: string, value: string, extra: string): this {
    this.fields.push({ name, type, value, extra });
    return this;
  }

  numberOfField(position: number): number {
    return FIRST_FIELD_NUMBER + position;
  }

  writer(): PdfWriter {
    const writer = new PdfWriter();
    const references = this.referencesText();
    writer.set(CATALOG, `<< /Type /Catalog /Pages ${PAGES} 0 R ${this.formEntry(references)} ${this.options.catalogExtra} >>`);
    writer.set(PAGES, `<< /Type /Pages /Kids [${PAGE} 0 R] /Count 1 >>`);
    writer.set(PAGE, `<< /Type /Page /Parent ${PAGES} 0 R /Annots [${references} ${this.extraAnnotationReferences()}] ${this.options.pageExtra} >>`);
    for (const [position, field] of this.fields.entries()) writer.set(this.numberOfField(position), this.fieldBody(field));
    return writer;
  }

  classic(options: Partial<ClassicOptions> = {}): Buffer {
    return classicPdf(this.writer(), options);
  }

  streamed(options: Partial<StreamedOptions> = {}): Buffer {
    const packed = [CATALOG, PAGES, PAGE, ...this.fieldNumbers()];
    return streamedPdf(this.writer(), { packed, ...options });
  }

  private fieldNumbers(): number[] {
    const numbers: number[] = [];
    for (const position of this.fields.keys()) numbers.push(this.numberOfField(position));
    return numbers;
  }

  private referencesText(): string {
    const references: string[] = [];
    for (const number of this.fieldNumbers()) references.push(`${number} 0 R`);
    return references.join(" ");
  }

  private extraAnnotationReferences(): string {
    const references: string[] = [];
    for (const number of this.options.extraAnnotations) references.push(`${number} 0 R`);
    return references.join(" ");
  }

  private formEntry(references: string): string {
    if (!this.options.acroForm) return "";
    return `/AcroForm << /Fields [${references}] ${this.options.formExtra} >>`;
  }

  private fieldBody(field: FieldSpec): string {
    return `<< /Type /Annot /Subtype /Widget /FT /${field.type} /T (${field.name}) ${valueEntry(field)} /Rect [0 0 10 10] ${field.extra} >>`;
  }
}

function valueEntry(field: FieldSpec): string {
  if (field.value === "") return "";
  return `/V ${field.value}`;
}
