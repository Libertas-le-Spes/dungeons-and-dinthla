import { sheetFromPdf } from "../../beyond/sheet/from-pdf/sheet-from-pdf";
import type { PrintedSheet } from "../../beyond/sheet/printed-sheet";
import { messageOf } from "../../views/dialogs/message-of";
import type { ImportFlow } from "./flows/import-flow";
import { READING, WRITE_FAILED } from "./import-words";
import type { PickedPdf } from "./picking/picked-pdf";
import { drawChooseNote, type TargetChooser } from "./steps/choose-note-step";
import { drawChoosePdf } from "./steps/choose-pdf-step";
import type { Review, ReviewActions } from "./steps/review";
import { drawReview } from "./steps/review-step";
import type { ImportTarget } from "./targets/import-target";

export interface StepsHost {
  runWrite(change: () => Promise<boolean>, failureWords: string): void;
  closeDialog(): void;
}

function onlyTargetOf(targets: readonly ImportTarget[]): ImportTarget | null {
  let only: ImportTarget | null = null;
  for (const target of targets) {
    if (only !== null) return null;
    only = target;
  }
  return only;
}

export class ImportSteps implements PickedPdf, TargetChooser, ReviewActions {
  private reading = false;
  private shown = true;
  private sheet: PrintedSheet | null = null;
  private review: Review | null = null;
  private writtenPath: string | null = null;

  constructor(
    private readonly contentEl: HTMLElement,
    private readonly flow: ImportFlow,
    private readonly today: string,
    private readonly host: StepsHost,
  ) {}

  written(): string | null {
    return this.writtenPath;
  }

  start(): void {
    this.showChoosePdf(null);
  }

  stop(): void {
    this.shown = false;
  }

  pdfPicked(bytes: Uint8Array): void {
    if (this.reading) return;
    this.reading = true;
    this.contentEl.empty();
    this.contentEl.createEl("p", { cls: "dd-import-reading", text: READING, attr: { "aria-live": "polite" } });
    void this.readSheet(bytes);
  }

  pdfRefused(reason: string): void {
    this.showChoosePdf(reason);
  }

  targetChosen(target: ImportTarget): void {
    if (this.sheet === null) return;
    void this.reviewWith(this.sheet, target, null);
  }

  writeChosen(): void {
    this.host.runWrite(this.writeReviewed.bind(this), WRITE_FAILED);
  }

  chooseAnother(): void {
    this.sheet = null;
    this.review = null;
    this.showChoosePdf(null);
  }

  closeChosen(): void {
    this.host.closeDialog();
  }

  writeFailed(error: unknown): void {
    const review = this.review;
    if (review === null) return;
    void this.reviewWith(review.sheet, review.target, messageOf(error));
  }

  private showChoosePdf(refusal: string | null): void {
    this.contentEl.empty();
    drawChoosePdf(this.contentEl, refusal, this);
  }

  private async readSheet(bytes: Uint8Array): Promise<void> {
    const read = await sheetFromPdf(bytes);
    this.reading = false;
    if (!this.shown) return;
    if (!read.ok) {
      this.showChoosePdf(read.reason);
      return;
    }
    this.sheet = read.sheet;
    this.showTargets(read.sheet);
  }

  private showTargets(sheet: PrintedSheet): void {
    const targets = this.flow.targetsFor(sheet);
    const only = onlyTargetOf(targets);
    if (only !== null) {
      void this.reviewWith(sheet, only, null);
      return;
    }
    this.contentEl.empty();
    drawChooseNote(this.contentEl, targets, this);
  }

  private async reviewWith(sheet: PrintedSheet, target: ImportTarget, failure: string | null): Promise<void> {
    let review: Review;
    try {
      review = { sheet, target, changes: await target.changesFor(sheet, this.today), refusal: failure };
    } catch (error) {
      review = { sheet, target, changes: null, refusal: messageOf(error) };
    }
    if (!this.shown) return;
    this.review = review;
    this.contentEl.empty();
    drawReview(this.contentEl, review, this);
  }

  private async writeReviewed(): Promise<boolean> {
    const review = this.review;
    if (review === null) return false;
    this.writtenPath = await review.target.bringIn(review.sheet, this.today, review.changes);
    return true;
  }
}
