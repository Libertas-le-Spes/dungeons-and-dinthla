import { describe, expect, it } from "vitest";
import { heapProblem } from "./heap-problem";
import { HEAP_GUARD_MB, WORKER_HEAP_LIMIT_MB } from "./memory-limits";

describe("the heap problem a test is stopped with", () => {
  it("is none while the heap is at or under the guard", () => {
    expect(heapProblem("a test", "a.test.ts", HEAP_GUARD_MB)).toBeNull();
  });

  it("names the test, the file and the size once the heap is over the guard", () => {
    const problem = heapProblem("a test", "a.test.ts", HEAP_GUARD_MB + 1);
    expect(problem).toContain(`${HEAP_GUARD_MB + 1} MB`);
    expect(problem).toContain('"a test" in a.test.ts');
  });

  it("starts below the hard heap limit, so the guard fails a test before Node aborts", () => {
    expect(HEAP_GUARD_MB).toBeLessThan(WORKER_HEAP_LIMIT_MB);
  });
});
