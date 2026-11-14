import type { PrintedSheet } from "../../beyond/sheet/printed-sheet";
import type { ImportFlow } from "./flows/import-flow";
import { DialogShown } from "./stages/dialog-shown";
import { OnlineStage, type OnlineArrival } from "./online/online-stage";
import type { OnlineSource } from "./online/online-source";
import { PdfSheetReader } from "./stages/pdf-sheet-reader";
import { PdfStage, type SheetArrival } from "./stages/pdf-stage";
import { ReviewStage, type StagesHost } from "./stages/review-stage";
import { PendingWork } from "../../views/pending/pending-work";

export interface StepsHost {
  runWrite(change: () => Promise<boolean>, failureWords: string): void;
  closeDialog(): void;
}

export class ImportSteps implements SheetArrival, OnlineArrival, StagesHost {
  private readonly shown = new DialogShown();
  private readonly work = new PendingWork();
  private readonly pdf: PdfStage;
  private readonly review: ReviewStage;

  constructor(
    contentEl: HTMLElement,
    private readonly flow: ImportFlow,
    today: string,
    online: OnlineSource,
    private readonly host: StepsHost,
  ) {
    this.pdf = new PdfStage(contentEl, this.shown, this, new PdfSheetReader(), this.work, new OnlineStage(contentEl, { shown: this.shown, arrival: this, source: online, work: this.work }));
    this.review = new ReviewStage(contentEl, this.shown, today, this, this.work);
  }

  written(): string | null {
    return this.review.written();
  }

  settled(): Promise<void> {
    return this.work.settled();
  }

  start(): void {
    this.pdf.show(null);
  }

  stop(): void {
    this.shown.stop();
  }

  sheetRead(sheet: PrintedSheet): void {
    const refusal = this.flow.refusalFor(sheet);
    if (refusal !== null) {
      this.pdf.show(refusal);
      return;
    }
    this.review.showTargets(sheet, this.flow.targetsFor(sheet));
  }

  onlineRefused(words: string): void {
    this.pdf.show(words);
  }

  writeFailed(error: unknown): void {
    this.review.writeFailed(error);
  }

  runWrite(change: () => Promise<boolean>, failureWords: string): void {
    this.host.runWrite(change, failureWords);
  }

  closeDialog(): void {
    this.host.closeDialog();
  }

  chooseAnother(): void {
    this.pdf.show(null);
  }
}
