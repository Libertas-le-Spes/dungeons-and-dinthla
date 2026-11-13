async function finished(work: Promise<void>): Promise<void> {
  try {
    await work;
  } catch {
    return;
  }
}

async function stillReported(work: Promise<void>): Promise<void> {
  await work;
}

export class PendingWork {
  private readonly pending = new Set<Promise<void>>();

  add(work: Promise<void>): void {
    void this.track(finished(work));
    void stillReported(work);
  }

  async settled(): Promise<void> {
    while (this.pending.size > 0) await Promise.all(this.pending);
  }

  private async track(piece: Promise<void>): Promise<void> {
    this.pending.add(piece);
    await piece;
    this.pending.delete(piece);
  }
}
