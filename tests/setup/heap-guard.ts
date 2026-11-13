import { afterEach } from "vitest";
import { heapProblem } from "./heap-problem";

const BYTES_PER_MB = 1024 * 1024;

function heapUsedMb(): number {
  return Math.round(process.memoryUsage().heapUsed / BYTES_PER_MB);
}

afterEach((context) => {
  const problem = heapProblem(context.task.name, context.task.file.name, heapUsedMb());
  if (problem !== null) throw new Error(problem);
});
