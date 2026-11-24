import type { SheetFromPdf } from "../../../beyond/sheet/from-pdf/sheet-from-pdf";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { READING, STILL_READING } from "../import-words";
import type { PickedPdf } from "../picking/picked-pdf";
import type { OnlineBlock } from "../online/online-block";
import { chooseSourceTrees } from "../steps/choose-source-step";
import { PdfPicker } from "../picking/pdf-picker";
import type { StageScreen } from "./stage-screen";
import { Paragraph } from "../../../views/elements/kinds/containers";
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

function readingLine(): Paragraph {
  return new Paragraph({ cls: ["dd-import-reading"], text: READING, live: "polite" });
}

export class PdfStage implements PickedPdf {
  private reading = false;
  private readonly picker: PdfPicker;

  constructor(
    private readonly screen: StageScreen,
    private readonly parts: PdfParts,
  ) {
    this.picker = new PdfPicker(this, parts.work);
  }

  show(refusal: string | null): void {
    this.screen.show(chooseSourceTrees({ refusal, online: this.parts.online, picker: this.picker }));
    this.parts.online.focus();
  }

  pdfPicked(bytes: Uint8Array): void {
    if (this.reading) {
      this.screen.show([readingLine(), new Paragraph({ cls: ["dd-import-reading", "dd-still-reading"], text: STILL_READING })]);
      return;
    }
    this.reading = true;
    this.screen.show([readingLine()]);
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
