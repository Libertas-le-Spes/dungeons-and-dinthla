import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { plainRefusalOf, READING_WENT_WRONG, wordsOf, WRITING_WENT_WRONG } from "../failure-words";
import { WRITE_FAILED } from "../import-words";
import { drawChooseNote, type TargetChooser } from "../steps/choose-note-step";
import type { Review, ReviewActions } from "../steps/review";
import { drawReview } from "../steps/review-step";
import type { ImportTarget } from "../targets/import-target";
import type { DialogShown } from "./dialog-shown";
import type { PendingWork } from "../../../views/drawing/pending-work";

export interface StagesHost {
  runWrite(change: () => Promise<boolean>, failureWords: string): void;
  closeDialog(): void;
  chooseAnother(): void;
}

function onlyTargetOf(targets: readonly ImportTarget[]): ImportTarget | null {
  let only: ImportTarget | null = null;
  for (const target of targets) {
    if (only !== null) return null;
    only = target;
  }
  return only;
}

export class ReviewStage implements TargetChooser, ReviewActions {
  private sheet: PrintedSheet | null = null;
  private review: Review | null = null;
  private writtenPath: string | null = null;

  constructor(
    private readonly contentEl: HTMLElement,
    private readonly shown: DialogShown,
    private readonly today: string,
    private readonly host: StagesHost,
    private readonly work: PendingWork,
  ) {}

  written(): string | null {
    return this.writtenPath;
  }

  showTargets(sheet: PrintedSheet, targets: readonly ImportTarget[]): void {
    this.sheet = sheet;
    const only = onlyTargetOf(targets);
    if (only !== null) {
      this.work.add(this.reviewWith(sheet, only, null));
      return;
    }
    this.contentEl.empty();
    drawChooseNote(this.contentEl, targets, this);
  }

  targetChosen(target: ImportTarget): void {
    if (this.sheet === null) return;
    this.work.add(this.reviewWith(this.sheet, target, null));
  }

  writeChosen(): void {
    this.host.runWrite(this.writeReviewed.bind(this), WRITE_FAILED);
  }

  chooseAnother(): void {
    this.sheet = null;
    this.review = null;
    this.host.chooseAnother();
  }

  closeChosen(): void {
    this.host.closeDialog();
  }

  writeFailed(error: unknown): void {
    const review = this.review;
    if (review === null) return;
    this.work.add(this.reviewWith(review.sheet, review.target, wordsOf(error, WRITING_WENT_WRONG)));
  }

  private async reviewWith(sheet: PrintedSheet, target: ImportTarget, failure: string | null): Promise<void> {
    let review: Review;
    try {
      review = { sheet, target, changes: await target.changesFor(sheet, this.today), refusal: null, failure };
    } catch (error) {
      review = { sheet, target, changes: null, refusal: wordsOf(error, READING_WENT_WRONG), failure };
    }
    if (this.shown.isShown === false) return;
    this.review = review;
    this.contentEl.empty();
    drawReview(this.contentEl, review, this);
  }

  private async writeReviewed(): Promise<boolean> {
    const review = this.review;
    if (review === null) return false;
    try {
      this.writtenPath = await review.target.bringIn(review.sheet, this.today, review.changes);
    } catch (error) {
      throw plainRefusalOf(error, WRITING_WENT_WRONG);
    }
    return true;
  }
}
