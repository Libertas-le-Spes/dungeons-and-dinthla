import { describe, expect, it } from "vitest";
import { STEPS_PER_TIME_CHECK, TIME_LIMIT_MS, WORK_EXTRA, WORK_PER_BYTE } from "../../../src/pdf/limits/pdf-limits";
import { WorkBudget } from "../../../src/pdf/work/work-budget";
import { refusalFrom } from "../support/parsed";

function spendSteps(work: WorkBudget, steps: number): void {
  for (let step = 0; step < steps; step += 1) work.spend();
}

describe("WorkBudget", () => {
  it("allows exactly its extra steps plus a fixed number for each input byte", () => {
    const work = new WorkBudget(10, () => 0);
    spendSteps(work, WORK_EXTRA + WORK_PER_BYTE * 10);
    expect(work.stepsTaken()).toBe(WORK_EXTRA + WORK_PER_BYTE * 10);
  });

  it("refuses the step after that", () => {
    const work = new WorkBudget(10, () => 0);
    spendSteps(work, WORK_EXTRA + WORK_PER_BYTE * 10);
    expect(refusalFrom(() => work.spend())).toContain("takes too much work");
  });

  it("allows more steps once more input has been unpacked", () => {
    const work = new WorkBudget(10, () => 0);
    work.addInput(5);
    spendSteps(work, WORK_EXTRA + WORK_PER_BYTE * 15);
    expect(refusalFrom(() => work.spend())).toContain("takes too much work");
  });

  it("looks at the clock once when it starts and then once each thousand steps", () => {
    let looks = 0;
    const work = new WorkBudget(1_000_000, () => {
      looks += 1;
      return 0;
    });
    spendSteps(work, STEPS_PER_TIME_CHECK * 3 - 1);
    expect(looks).toBe(3);
    work.spend();
    expect(looks).toBe(4);
  });

  it("refuses once the clock is past the time limit at a check", () => {
    let now = 0;
    const work = new WorkBudget(1_000_000, () => now);
    now = TIME_LIMIT_MS + 1;
    spendSteps(work, STEPS_PER_TIME_CHECK - 1);
    expect(refusalFrom(() => work.spend())).toContain("took too long");
  });

  it("accepts a clock exactly at the time limit", () => {
    let now = 0;
    const work = new WorkBudget(1_000_000, () => now);
    now = TIME_LIMIT_MS;
    spendSteps(work, STEPS_PER_TIME_CHECK);
    expect(work.stepsTaken()).toBe(STEPS_PER_TIME_CHECK);
  });

  it("checks the time on request without spending a step", () => {
    let now = 0;
    const work = new WorkBudget(10, () => now);
    now = TIME_LIMIT_MS + 1;
    expect(refusalFrom(() => work.checkTime())).toContain("took too long");
    expect(work.stepsTaken()).toBe(0);
  });
});
