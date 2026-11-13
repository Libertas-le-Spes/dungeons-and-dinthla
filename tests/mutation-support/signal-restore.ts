import type { Backups } from "./backups.ts";

export const STOPPING_SIGNALS = ["SIGINT", "SIGTERM"] as const;
const STOPPED_BY_SIGNAL = 130;

export interface StoppableProcess {
  on(signal: string, listener: () => void): unknown;
  exit(code: number): never;
}

class RestoreAndExit {
  private readonly backups: Backups;
  private readonly running: StoppableProcess;

  constructor(backups: Backups, running: StoppableProcess) {
    this.backups = backups;
    this.running = running;
  }

  stop(): void {
    const restored = this.backups.restoreAll();
    console.log(JSON.stringify({ stopped: true, restored }));
    this.running.exit(STOPPED_BY_SIGNAL);
  }
}

export function restoreOnSignal(backups: Backups, running: StoppableProcess): void {
  const restorer = new RestoreAndExit(backups, running);
  for (const signal of STOPPING_SIGNALS) running.on(signal, restorer.stop.bind(restorer));
}
