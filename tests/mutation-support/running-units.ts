import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import type { Command } from "./memory-box.ts";

export interface RunEnd {
  started: boolean;
  signal: string | null;
}

export interface RunPlace {
  cwd: string;
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
}

export interface Stoppable {
  stopCurrent(): void;
}

const GROUP_KILL = "SIGKILL";

class OneRun {
  private settled = false;
  private timer: NodeJS.Timeout | null = null;
  private readonly child: ChildProcess;
  private readonly finish: (end: RunEnd) => void;

  constructor(child: ChildProcess, finish: (end: RunEnd) => void) {
    this.child = child;
    this.finish = finish;
  }

  watch(timeoutMs: number, stop: () => void): void {
    this.timer = setTimeout(stop, timeoutMs);
    this.child.once("exit", this.exited.bind(this));
    this.child.once("error", this.failedToStart.bind(this));
  }

  private exited(_code: number | null, signal: string | null): void {
    this.end({ started: true, signal });
  }

  private failedToStart(): void {
    this.end({ started: false, signal: null });
  }

  private end(end: RunEnd): void {
    if (this.settled) return;
    this.settled = true;
    if (this.timer !== null) clearTimeout(this.timer);
    this.finish(end);
  }
}

export class RunningUnits implements Stoppable {
  private current: { unit: string; child: ChildProcess } | null = null;
  private count = 0;
  private readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  nextUnit(): string {
    this.count += 1;
    return `${this.prefix}-${process.pid}-${this.count}`;
  }

  run(unit: string, command: Command, place: RunPlace): Promise<RunEnd> {
    const child = spawn(command.program, command.args, { cwd: place.cwd, env: place.env, detached: true, stdio: "ignore" });
    this.current = { unit, child };
    return new Promise<RunEnd>(this.waiterFor(child, place.timeoutMs));
  }

  stopCurrent(): void {
    const current = this.current;
    if (current === null) return;
    spawnSync("systemctl", ["--user", "stop", `${current.unit}.scope`], { stdio: "ignore" });
    killGroup(current.child);
  }

  private waiterFor(child: ChildProcess, timeoutMs: number): (resolve: (end: RunEnd) => void) => void {
    const units = this;
    return function waitFor(resolve: (end: RunEnd) => void): void {
      const run = new OneRun(child, function finished(end: RunEnd): void {
        units.forget(child);
        resolve(end);
      });
      run.watch(timeoutMs, units.stopCurrent.bind(units));
    };
  }

  private forget(child: ChildProcess): void {
    if (this.current !== null && this.current.child === child) this.current = null;
  }
}

function killGroup(child: ChildProcess): void {
  if (child.pid === undefined) return;
  try {
    process.kill(-child.pid, GROUP_KILL);
  } catch {
    return;
  }
}
