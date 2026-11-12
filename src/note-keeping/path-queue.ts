function nothing(): void {}

export class PathQueue {
  private readonly chains = new Map<string, Promise<void>>();

  run(path: string, job: () => Promise<void>): Promise<void> {
    const before = this.chains.get(path);
    const after = this.after(before, job);
    this.chains.set(path, after.then(nothing, nothing));
    return after;
  }

  private async after(before: Promise<void> | undefined, job: () => Promise<void>): Promise<void> {
    if (before !== undefined) await before;
    await job();
  }
}
