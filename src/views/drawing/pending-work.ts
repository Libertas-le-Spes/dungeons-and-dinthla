async function bothOf(earlier: Promise<void>, later: Promise<void>): Promise<void> {
  await earlier;
  await later;
}

export class PendingWork {
  private all: Promise<void> = Promise.resolve();

  add(work: Promise<void>): void {
    this.all = bothOf(this.all, work);
  }

  async settled(): Promise<void> {
    let waited: Promise<void> | null = null;
    while (waited !== this.all) {
      waited = this.all;
      await waited;
    }
  }
}
