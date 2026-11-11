export interface RunningSave {
  path: string;
}

export class RunningSaves {
  private readonly runs = new Map<string, RunningSave>();

  isRunning(path: string): boolean {
    return this.runs.has(path);
  }

  start(path: string): RunningSave | null {
    if (this.runs.has(path)) return null;
    const run = { path };
    this.runs.set(path, run);
    return run;
  }

  moved(oldPath: string, path: string): void {
    const run = this.runs.get(oldPath);
    if (run === undefined) return;
    this.runs.delete(oldPath);
    run.path = path;
    this.runs.set(path, run);
  }

  finish(run: RunningSave): void {
    if (this.runs.get(run.path) === run) this.runs.delete(run.path);
  }
}
