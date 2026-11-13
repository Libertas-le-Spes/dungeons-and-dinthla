import { HEAP_GUARD_MB } from "./memory-limits";

export interface HeapReading {
  usedMb(): number;
  collectGarbage(): void;
}

export function heapProblem(testName: string, fileName: string, heap: HeapReading): string | null {
  if (heap.usedMb() <= HEAP_GUARD_MB) return null;
  heap.collectGarbage();
  const usedMb = heap.usedMb();
  if (usedMb <= HEAP_GUARD_MB) return null;
  return `The test worker still holds ${usedMb} MB of heap after collecting garbage, following "${testName}" in ${fileName}, over the ${HEAP_GUARD_MB} MB guard. Something this file opens is not closed or released between tests, so stop here instead of letting Node abort with an out-of-memory crash.`;
}
