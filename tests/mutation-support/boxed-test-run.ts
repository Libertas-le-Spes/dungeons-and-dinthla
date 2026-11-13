import { WORKER_HEAP_LIMIT_MB } from "../setup/memory-limits.ts";
import { boxed, memoryBoxIsAvailable, type Command, type Limits } from "./memory-box.ts";
import type { RunEnd, RunPlace } from "./running-units.ts";
import { clearReport, readReport, type SuiteResult } from "./suite-results.ts";

const OUTER_GRACE_SECONDS = 30;
const MILLISECONDS = 1000;

export interface TestRun {
  root: string;
  suites: string[];
  report: string;
  limits: Limits;
}

export interface UnitRunner {
  nextUnit(): string;
  run(unit: string, command: Command, place: RunPlace): Promise<RunEnd>;
}

function vitestCommand(run: TestRun): Command {
  return { program: "npx", args: ["vitest", "run", ...run.suites, "--maxWorkers=1", "--reporter=json", `--outputFile=${run.report}`] };
}

function runEnvironment(): NodeJS.ProcessEnv {
  return { ...process.env, CI: "1", NODE_OPTIONS: `--max-old-space-size=${WORKER_HEAP_LIMIT_MB}` };
}

function outerTimeout(limits: Limits): number {
  return (limits.seconds + OUTER_GRACE_SECONDS) * MILLISECONDS;
}

export function assertMemoryBox(): void {
  if (!memoryBoxIsAvailable()) throw new Error("A memory box could not be made (systemd-run --user --scope with a memory limit failed), so no mutation was run. Nothing was changed.");
}

export async function boxedTestRun(run: TestRun, units: UnitRunner): Promise<SuiteResult[] | null> {
  clearReport(run.report);
  const unit = units.nextUnit();
  const end = await units.run(unit, boxed(run.limits, vitestCommand(run), unit), { cwd: run.root, env: runEnvironment(), timeoutMs: outerTimeout(run.limits) });
  if (end.started === false) return null;
  if (end.signal !== null) return null;
  return readReport(run.report);
}
