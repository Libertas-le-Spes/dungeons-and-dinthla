import { spawnSync } from "node:child_process";
import { PROBE } from "../../scripts/memory-box.ts";

export interface Limits {
  memoryMax: string;
  seconds: number;
}

export type { Command } from "../../scripts/memory-box.ts";
export { PROBE } from "../../scripts/memory-box.ts";
import type { Command } from "../../scripts/memory-box.ts";

const SCOPE = ["--user", "--scope", "-q", "-p", "CPUWeight=10", "-p", "IOWeight=10", "-p", "MemorySwapMax=0"];
const NICE = ["nice", "-n", "19"];
const KILL_AFTER_SECONDS = 5;

export function memoryBoxIsAvailable(): boolean {
  const result = spawnSync(PROBE.program, PROBE.args, { stdio: "ignore" });
  return result.status === 0;
}

export function boxed(limits: Limits, command: Command, unit: string): Command {
  const runtime = limits.seconds + KILL_AFTER_SECONDS;
  const box = [...SCOPE, `--unit=${unit}`, "-p", `MemoryMax=${limits.memoryMax}`, "-p", `RuntimeMaxSec=${runtime}`, ...NICE];
  const timeLimit = ["timeout", "-k", String(KILL_AFTER_SECONDS), String(limits.seconds)];
  return { program: "systemd-run", args: [...box, ...timeLimit, command.program, ...command.args] };
}
