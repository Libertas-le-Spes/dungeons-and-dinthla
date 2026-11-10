import { describe, expect, it } from "vitest";
import type { Check, RecordChange } from "../../src/campaign/record-change";
import type { Refused, Verdict } from "../../src/campaign/verdict";
import { writeRecordChange } from "../../src/campaign/write-record-change";

interface CandlePlan {
  wick: string;
}

class CandleChange implements RecordChange<CandlePlan> {
  readonly steps: string[] = [];
  readonly checks: Check<CandlePlan>[];

  constructor(
    private readonly planned: CandlePlan | Refused,
    verdicts: Verdict[],
  ) {
    this.checks = verdicts.map((verdict, index) => (plan: CandlePlan) => {
      this.steps.push(`check ${index} ${plan.wick}`);
      return verdict;
    });
  }

  plan(): CandlePlan | Refused {
    this.steps.push("plan");
    return this.planned;
  }

  async writePlan(plan: CandlePlan): Promise<boolean> {
    this.steps.push(`write ${plan.wick}`);
    return true;
  }
}

describe("writeRecordChange", () => {
  it("plans, runs every check in order on the plan, then writes it once", async () => {
    const change = new CandleChange({ wick: "long" }, ["go on", "go on"]);
    expect(await writeRecordChange(change)).toBe(true);
    expect(change.steps).toEqual(["plan", "check 0 long", "check 1 long", "write long"]);
  });

  it("gives back what the write says", async () => {
    const change = new CandleChange({ wick: "long" }, []);
    change.writePlan = async () => false;
    expect(await writeRecordChange(change)).toBe(false);
  });

  it("refuses with the plan's own words, checking and writing nothing", async () => {
    const change = new CandleChange({ refused: "No wick to light." }, ["go on"]);
    await expect(writeRecordChange(change)).rejects.toThrow("No wick to light.");
    expect(change.steps).toEqual(["plan"]);
  });

  it("stops at the first check that refuses, in its words, writing nothing", async () => {
    const change = new CandleChange({ wick: "long" }, ["go on", { refused: "The wick is wet." }, { refused: "The wax is gone." }]);
    await expect(writeRecordChange(change)).rejects.toThrow("The wick is wet.");
    expect(change.steps).toEqual(["plan", "check 0 long", "check 1 long"]);
  });

  it("stops with nothing written when a check says there is nothing to write", async () => {
    const change = new CandleChange({ wick: "long" }, ["write nothing", { refused: "The wick is wet." }]);
    expect(await writeRecordChange(change)).toBe(false);
    expect(change.steps).toEqual(["plan", "check 0 long"]);
  });

  it("waits for a check that reads the notes before it writes", async () => {
    const change = new CandleChange({ wick: "long" }, []);
    change.checks.push(async () => {
      await Promise.resolve();
      change.steps.push("read the notes");
      return { refused: "The notes changed." };
    });
    await expect(writeRecordChange(change)).rejects.toThrow("The notes changed.");
    expect(change.steps).toEqual(["plan", "read the notes"]);
  });
});
