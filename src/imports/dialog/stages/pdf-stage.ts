import type { SheetFromPdf } from "../../../beyond/sheet/from-pdf/sheet-from-pdf";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { READING, STILL_READING } from "../import-words";
import type { PickedPdf } from "../picking/picked-pdf";
import type { OnlineBlock } from "../online/online-block";
import { drawChooseSource } from "../steps/choose-source-step";
import type { DialogShown } from "./dialog-shown";
import type { PendingWork } from "../../../views/pending/pending-work";

export interface SheetArrival {
  sheetRead(sheet: PrintedSheet): void;
}

export interface SheetReader {
  sheetOf(bytes: Uint8Array): Promise<SheetFromPdf>;
}

export interface PdfParts {
  readonly shown: DialogShown;
  readonly arrival: SheetArrival;
  readonly reader: SheetReader;
  readonly work: PendingWork;
  readonly online: OnlineBlock;
}

export class PdfStage implements PickedPdf {
  private reading = false;

  constructor(
    private readonly contentEl: HTMLElement,
    private readonly parts: PdfParts,
  ) {}

  show(refusal: string | null): void {
    this.contentEl.empty();
    drawChooseSource(this.contentEl, { refusal, online: this.parts.online, picked: this, work: this.parts.work });
  }

  pdfPicked(bytes: Uint8Array): void {
    if (this.reading) {
      this.contentEl.createEl("p", { cls: "dd-import-reading dd-still-reading", text: STILL_READING });
      return;
    }
    this.reading = true;
    this.contentEl.empty();
    this.contentEl.createEl("p", { cls: "dd-import-reading", text: READING, attr: { "aria-live": "polite" } });
    this.parts.work.add(this.readSheet(bytes));
  }

  pdfRefused(reason: string): void {
    this.show(reason);
  }

  private async readSheet(bytes: Uint8Array): Promise<void> {
    const read = await this.parts.reader.sheetOf(bytes);
    this.reading = false;
    if (this.parts.shown.isShown === false) return;
    if (read.ok === false) {
      this.show(read.reason);
      return;
    }
    this.parts.arrival.sheetRead(read.sheet);
  }
}
