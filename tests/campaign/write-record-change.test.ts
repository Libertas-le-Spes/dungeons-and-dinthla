import { describe, expect, it } from "vitest";
import type { Check, RecordChange } from "../../src/campaign/record-change";
import { linesAddedTo, type SessionChange } from "../../src/campaign/session-change";
import type { Verdict } from "../../src/campaign/verdict";
import { writeRecordChange } from "../../src/campaign/write-record-change";

interface CandlePlan {
  wick: string;
}

class CandleChange implements RecordChange<CandlePlan> {
  readonly steps: string[] = [];
  readonly checks: Check<CandlePlan>[];

  constructor(
    private readonly planned: CandlePlan | { error: string },
    verdicts: Verdict[],
  ) {
    this.checks = verdicts.map((verdict, index) => (plan: CandlePlan) => {
      this.steps.push(`check ${index} ${plan.wick}`);
      return verdict;
    });
  }

  plan(): CandlePlan | { error: string } {
    this.steps.push("plan");
    return this.planned;
  }

  sessionChangeOf(plan: CandlePlan): SessionChange {
    return linesAddedTo("Pale Moon/Sessions/Session 1.md", [`$ Candle with a ${plan.wick} wick`]);
  }
}

class CandleWriter {
  wrote = true;

  constructor(private readonly steps: string[]) {}

  async apply(change: SessionChange): Promise<boolean> {
    if ("rewrite" in change || change.added === null) throw new Error("not the candle's change");
    this.steps.push(`write ${change.added.lines.join(" ")}`);
    return this.wrote;
  }
}

function run(change: CandleChange): { writing: Promise<boolean>; writer: CandleWriter } {
  const writer = new CandleWriter(change.steps);
  return { writing: writeRecordChange(change, writer), writer };
}

describe("writeRecordChange", () => {
  it("writes a plan that is plain text", async () => {
    const steps: string[] = [];
    const change: RecordChange<string> = {
      plan: () => "long",
      checks: [],
      sessionChangeOf: (wick) => linesAddedTo("Pale Moon/Sessions/Session 1.md", [`$ Candle with a ${wick} wick`]),
    };
    expect(await writeRecordChange(change, new CandleWriter(steps))).toBe(true);
    expect(steps).toEqual(["write $ Candle with a long wick"]);
  });

  it("plans, runs every check in order on the plan, then writes the plan's session change once", async () => {
    const change = new CandleChange({ wick: "long" }, ["go on", "go on"]);
    expect(await run(change).writing).toBe(true);
    expect(change.steps).toEqual(["plan", "check 0 long", "check 1 long", "write $ Candle with a long wick"]);
  });

  it("gives back what the write says", async () => {
    const change = new CandleChange({ wick: "long" }, []);
    const writer = new CandleWriter(change.steps);
    writer.wrote = false;
    expect(await writeRecordChange(change, writer)).toBe(false);
  });

  it("refuses with the plan's own words, checking and writing nothing", async () => {
    const change = new CandleChange({ error: "No wick to light." }, ["go on"]);
    await expect(run(change).writing).rejects.toThrow("No wick to light.");
    expect(change.steps).toEqual(["plan"]);
  });

  it("stops at the first check that refuses, in its words, writing nothing", async () => {
    const change = new CandleChange({ wick: "long" }, ["go on", { error: "The wick is wet." }, { error: "The wax is gone." }]);
    await expect(run(change).writing).rejects.toThrow("The wick is wet.");
    expect(change.steps).toEqual(["plan", "check 0 long", "check 1 long"]);
  });

  it("stops with nothing written when a check says there is nothing to write", async () => {
    const change = new CandleChange({ wick: "long" }, ["write nothing", { error: "The wick is wet." }]);
    expect(await run(change).writing).toBe(false);
    expect(change.steps).toEqual(["plan", "check 0 long"]);
  });

  it("waits for a check that reads the notes before it writes", async () => {
    const change = new CandleChange({ wick: "long" }, []);
    change.checks.push(async (): Promise<Verdict> => {
      await Promise.resolve();
      change.steps.push("read the notes");
      return "go on";
    });
    expect(await run(change).writing).toBe(true);
    expect(change.steps).toEqual(["plan", "read the notes", "write $ Candle with a long wick"]);
  });

  it("refuses in the words of a check that reads the notes, writing nothing", async () => {
    const change = new CandleChange({ wick: "long" }, []);
    change.checks.push(async () => {
      await Promise.resolve();
      return { error: "The notes changed." };
    });
    await expect(run(change).writing).rejects.toThrow("The notes changed.");
    expect(change.steps).toEqual(["plan"]);
  });
});
