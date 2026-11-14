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

export interface StepsParts {
  readonly flow: ImportFlow;
  readonly today: string;
  readonly online: OnlineSource;
  readonly host: StepsHost;
}

export class ImportSteps implements SheetArrival, OnlineArrival, StagesHost {
  private readonly shown = new DialogShown();
  private readonly work = new PendingWork();
  private readonly pdf: PdfStage;
  private readonly review: ReviewStage;

  constructor(
    contentEl: HTMLElement,
    private readonly parts: StepsParts,
  ) {
    const online = new OnlineStage(contentEl, { shown: this.shown, arrival: this, source: parts.online, work: this.work });
    this.pdf = new PdfStage(contentEl, { shown: this.shown, arrival: this, reader: new PdfSheetReader(), work: this.work, online });
    this.review = new ReviewStage(contentEl, this.shown, parts.today, this, this.work);
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
    const refusal = this.parts.flow.refusalFor(sheet);
    if (refusal !== null) {
      this.pdf.show(refusal);
      return;
    }
    this.review.showTargets(sheet, this.parts.flow.targetsFor(sheet));
  }

  onlineRefused(words: string): void {
    this.pdf.show(words);
  }

  writeFailed(error: unknown): void {
    this.review.writeFailed(error);
  }

  runWrite(change: () => Promise<boolean>, failureWords: string): void {
    this.parts.host.runWrite(change, failureWords);
  }

  closeDialog(): void {
    this.parts.host.closeDialog();
  }

  chooseAnother(): void {
    this.pdf.show(null);
  }
}
