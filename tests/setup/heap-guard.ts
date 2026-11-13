import { afterEach } from "vitest";
import { heapProblem, type HeapReading } from "./heap-problem";

const BYTES_PER_MB = 1024 * 1024;

const WORKER_HEAP: HeapReading = {
  usedMb: () => Math.round(process.memoryUsage().heapUsed / BYTES_PER_MB),
  collectGarbage: () => {
    if (globalThis.gc === undefined) throw new Error("The worker was started without --expose-gc, so the heap guard cannot tell garbage from a leak.");
    globalThis.gc();
  },
};

afterEach((context) => {
  const problem = heapProblem(context.task.name, context.task.file.name, WORKER_HEAP);
  if (problem !== null) throw new Error(problem);
});
