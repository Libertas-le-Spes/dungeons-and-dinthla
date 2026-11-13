import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Leaving } from "./signal-restore.ts";

const LOCKS_FOLDER = ".mutation-backups";
const NO_SUCH_PROCESS = "ESRCH";

export interface LockHolder {
  isAlive(pid: number): boolean;
}

export class ProcessTable implements LockHolder {
  isAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return (error as NodeJS.ErrnoException).code !== NO_SUCH_PROCESS;
    }
  }
}

export class RunLock implements Leaving {
  private readonly path: string;
  private readonly holders: LockHolder;
  private held = false;

  constructor(root: string, area: string, holders: LockHolder) {
    this.holders = holders;
    this.path = join(root, LOCKS_FOLDER, `${area}.lock`);
  }

  take(pid: number): string | null {
    mkdirSync(join(this.path, ".."), { recursive: true });
    const holder = this.holderPid();
    if (holder !== null && this.holders.isAlive(holder)) return `Another mutation run of this area is going (process ${holder}), so nothing was run.`;
    if (holder !== null) rmSync(this.path, { force: true });
    writeFileSync(this.path, String(pid), { flag: "wx" });
    this.held = true;
    return null;
  }

  leave(): void {
    if (this.held === false) return;
    rmSync(this.path, { force: true });
    this.held = false;
  }

  private holderPid(): number | null {
    let text: string;
    try {
      text = readFileSync(this.path, "utf8");
    } catch {
      return null;
    }
    const pid = Number(text.trim());
    if (Number.isInteger(pid) === false || pid <= 0) return null;
    return pid;
  }
}
