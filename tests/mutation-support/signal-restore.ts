import type { Backups } from "./backups.ts";
import type { Stoppable } from "./running-units.ts";

export const STOPPING_SIGNALS = ["SIGINT", "SIGTERM"] as const;
export const STOPPED_BY_SIGNAL = 130;

export interface StoppableProcess {
  on(signal: string, listener: () => void): unknown;
  exit(code: number): never;
}

export interface Leaving {
  leave(): void;
}

class RestoreAndExit {
  private readonly running: Stoppable;
  private readonly backups: Backups;
  private readonly leaving: Leaving;
  private readonly host: StoppableProcess;

  constructor(running: Stoppable, backups: Backups, leaving: Leaving, host: StoppableProcess) {
    this.running = running;
    this.backups = backups;
    this.leaving = leaving;
    this.host = host;
  }

  stop(): void {
    this.running.stopCurrent();
    const restored = this.backups.restoreAll();
    this.leaving.leave();
    console.log(JSON.stringify({ stopped: true, restored }));
    this.host.exit(STOPPED_BY_SIGNAL);
  }
}

export function restoreOnSignal(running: Stoppable, backups: Backups, leaving: Leaving, host: StoppableProcess): void {
  const restorer = new RestoreAndExit(running, backups, leaving, host);
  for (const signal of STOPPING_SIGNALS) host.on(signal, restorer.stop.bind(restorer));
}
