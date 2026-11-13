import { describe, expect, it, vi } from "vitest";
import { heapProblem, type HeapReading } from "./heap-problem";
import { HEAP_GUARD_MB } from "./memory-limits";

function heapReading(beforeCollectingMb: number, afterCollectingMb: number) {
  const collectGarbage = vi.fn();
  const usedMb = () => {
    if (collectGarbage.mock.calls.length > 0) return afterCollectingMb;
    return beforeCollectingMb;
  };
  return { usedMb, collectGarbage } satisfies HeapReading;
}

describe("the heap problem a test is stopped with", () => {
  it("is none while the heap is at or under the guard, without collecting garbage", () => {
    const heap = heapReading(HEAP_GUARD_MB, 0);
    expect(heapProblem("a test", "a.test.ts", heap)).toBeNull();
    expect(heap.collectGarbage).not.toHaveBeenCalled();
  });

  it("is none when the heap is over the guard only because of garbage that collecting frees", () => {
    const heap = heapReading(HEAP_GUARD_MB + 200, HEAP_GUARD_MB - 100);
    expect(heapProblem("a test", "a.test.ts", heap)).toBeNull();
    expect(heap.collectGarbage).toHaveBeenCalledTimes(1);
  });

  it("names the test, the file and the size when the heap is still over the guard after collecting", () => {
    const heap = heapReading(HEAP_GUARD_MB + 200, HEAP_GUARD_MB + 1);
    const problem = heapProblem("a test", "a.test.ts", heap);
    expect(heap.collectGarbage).toHaveBeenCalledTimes(1);
    expect(problem).toContain(`${HEAP_GUARD_MB + 1} MB`);
    expect(problem).toContain('"a test" in a.test.ts');
  });
});
