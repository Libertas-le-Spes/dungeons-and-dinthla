import { MOST_PDF_BYTES } from "../../../beyond/sheet/from-pdf/sheet-from-pdf";
import { CHOOSE_A_FILE, FILE_NOT_READ, fileTooBig } from "../import-words";
import type { PickedPdf } from "./picked-pdf";
import type { PendingWork } from "../../../views/pending/pending-work";

const FIRST_FILE = 0;

export class PdfPicker {
  private readonly input: HTMLInputElement;

  constructor(
    parent: HTMLElement,
    private readonly picked: PickedPdf,
    private readonly work: PendingWork,
  ) {
    const label = parent.createEl("label", { cls: "dd-pdf-picker", text: CHOOSE_A_FILE });
    this.input = label.createEl("input", { type: "file", attr: { "aria-label": CHOOSE_A_FILE } });
    this.input.addEventListener("change", this);
  }

  handleEvent(): void {
    this.work.add(this.readSafely());
  }

  focus(): void {
    this.input.focus();
  }

  private async readSafely(): Promise<void> {
    try {
      await this.readChosen();
    } catch {
      this.picked.pdfRefused(FILE_NOT_READ);
    }
  }

  private async readChosen(): Promise<void> {
    const list = this.input.files;
    if (list === null) return;
    const file = list.item(FIRST_FILE);
    if (file === null) return;
    if (file.size > MOST_PDF_BYTES) {
      this.picked.pdfRefused(fileTooBig(MOST_PDF_BYTES));
      return;
    }
    await this.readBytes(file);
  }

  private async readBytes(file: Blob): Promise<void> {
    const buffer = await file.arrayBuffer();
    this.picked.pdfPicked(new Uint8Array(buffer));
  }
}
