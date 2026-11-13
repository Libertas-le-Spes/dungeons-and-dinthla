import { HEAP_GUARD_MB } from "./memory-limits";

export function heapProblem(testName: string, fileName: string, usedMb: number): string | null {
  if (usedMb <= HEAP_GUARD_MB) return null;
  return `The test worker holds ${usedMb} MB of heap after "${testName}" in ${fileName}, over the ${HEAP_GUARD_MB} MB guard. Something this file opens is not closed or released between tests, so stop here instead of letting Node abort with an out-of-memory crash.`;
}
