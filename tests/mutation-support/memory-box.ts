import { spawnSync } from "node:child_process";

const SCOPE = ["--user", "--scope", "-q", "-p", "CPUWeight=10", "-p", "IOWeight=10", "-p", "MemorySwapMax=0"];
const NICE = ["nice", "-n", "19"];
const KILL_AFTER_SECONDS = "5";

export interface Limits {
  memoryMax: string;
  seconds: number;
}

export function memoryBoxIsAvailable(): boolean {
  const result = spawnSync("systemd-run", ["--user", "--version"], { encoding: "utf8" });
  return result.error === undefined && result.status === 0;
}

export function boxed(limits: Limits, command: string[]): string[] {
  const box = [...SCOPE, "-p", `MemoryMax=${limits.memoryMax}`, ...NICE];
  return ["systemd-run", ...box, "timeout", "-k", KILL_AFTER_SECONDS, String(limits.seconds), ...command];
}
