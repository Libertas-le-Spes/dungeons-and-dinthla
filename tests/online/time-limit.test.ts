import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Refusal } from "../../src/beyond/shape/refusal";
import { withinTimeLimit } from "../../src/online/time-limit";

const LIMIT = 1_000;

function resolver(): { work: Promise<string>; settle: (value: string) => void; fail: (error: Error) => void } {
  let settle: (value: string) => void = () => {};
  let fail: (error: Error) => void = () => {};
  const work = new Promise<string>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });
  return { work, settle, fail };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("withinTimeLimit", () => {
  it("gives the value of work done in time and leaves no timer running", async () => {
    const held = resolver();
    const limited = withinTimeLimit(held.work, LIMIT, new Refusal("late"));
    held.settle("done");
    expect(await limited).toBe("done");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("passes on the failure of work that fails in time and leaves no timer running", async () => {
    const held = resolver();
    const limited = withinTimeLimit(held.work, LIMIT, new Refusal("late"));
    const caught = limited.catch((error: unknown) => error);
    held.fail(new Error("broke"));
    expect(await caught).toEqual(new Error("broke"));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("gives the refusal it was handed once the limit is up, and not a moment before", async () => {
    const held = resolver();
    const refusal = new Refusal("late");
    const caught = withinTimeLimit(held.work, LIMIT, refusal).catch((error: unknown) => error);
    let finished = false;
    void caught.then(() => {
      finished = true;
    });
    await vi.advanceTimersByTimeAsync(LIMIT - 1);
    expect(finished).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await caught).toBe(refusal);
  });

  it("ignores work that finishes after the limit, whether it succeeds or fails", async () => {
    const late = resolver();
    const caught = withinTimeLimit(late.work, LIMIT, new Refusal("late")).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(LIMIT);
    late.settle("too late");
    expect(await caught).toEqual(new Refusal("late"));
    const failing = resolver();
    const caughtFailure = withinTimeLimit(failing.work, LIMIT, new Refusal("late")).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(LIMIT);
    failing.fail(new Error("later"));
    expect(await caughtFailure).toEqual(new Refusal("late"));
  });
});
