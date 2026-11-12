import { MAX_VALUES_PARSED, STEPS_PER_TIME_CHECK, TIME_LIMIT_MS, WORK_EXTRA, WORK_PER_BYTE } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";
import type { Clock } from "./clock";

export class WorkBudget {
  private steps = 0;
  private values = 0;
  private allowedSteps: number;
  private readonly startedAt: number;
  private lastLook: number;

  constructor(
    inputBytes: number,
    private readonly clock: Clock,
  ) {
    this.allowedSteps = WORK_EXTRA + WORK_PER_BYTE * inputBytes;
    this.startedAt = clock();
    this.lastLook = this.startedAt;
  }

  addInput(bytes: number): void {
    this.allowedSteps += WORK_PER_BYTE * bytes;
  }

  countValue(): void {
    this.values += 1;
    if (this.values > MAX_VALUES_PARSED) throw new PdfRefusal("This file holds too many values to read, so it was not read.");
  }

  spend(): void {
    this.steps += 1;
    if (this.steps > this.allowedSteps) throw new PdfRefusal("This file takes too much work to read, so it was not read.");
    if (this.steps % STEPS_PER_TIME_CHECK === 0) this.checkTime();
  }

  checkTime(): void {
    const now = this.clock();
    if (now < this.lastLook) throw new PdfRefusal("The clock went backwards while this file was read, so it was not read.");
    this.lastLook = now;
    if (now - this.startedAt > TIME_LIMIT_MS) throw new PdfRefusal("This file took too long to read, so it was not read.");
  }

  stepsTaken(): number {
    return this.steps;
  }
}
