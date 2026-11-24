import { MOST_PDF_BYTES } from "../../../beyond/sheet/from-pdf/sheet-from-pdf";
import { CHOOSE_A_FILE, FILE_NOT_READ, fileTooBig } from "../import-words";
import type { PickedPdf } from "./picked-pdf";
import type { PendingWork } from "../../../views/pending/pending-work";
import { Label } from "../../../views/elements/kinds/containers";
import { FileInput, type ChosenFile, type FileChoice } from "../../../views/elements/kinds/fields";
import type { ViewElement } from "../../../views/elements/view-element";

export class PdfPicker implements FileChoice {
  constructor(
    private readonly picked: PickedPdf,
    private readonly work: PendingWork,
  ) {}

  tree(): ViewElement {
    return new Label({ cls: ["dd-pdf-picker"], text: CHOOSE_A_FILE }, [new FileInput({ label: CHOOSE_A_FILE }, this)]);
  }

  chosen(file: ChosenFile): void {
    this.work.add(this.readSafely(file));
  }

  private async readSafely(file: ChosenFile): Promise<void> {
    try {
      await this.readChosen(file);
    } catch {
      this.picked.pdfRefused(FILE_NOT_READ);
    }
  }

  private async readChosen(file: ChosenFile): Promise<void> {
    if (file.size > MOST_PDF_BYTES) {
      this.picked.pdfRefused(fileTooBig(MOST_PDF_BYTES));
      return;
    }
    this.picked.pdfPicked(await file.bytes());
  }
}
