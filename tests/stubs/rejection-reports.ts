type RejectionListener = NodeJS.UnhandledRejectionListener;

export class RejectionReports {
  readonly reasons: unknown[] = [];
  private readonly others: RejectionListener[];
  private readonly listener = this.report.bind(this);

  constructor() {
    this.others = process.listeners("unhandledRejection");
    process.removeAllListeners("unhandledRejection");
    process.on("unhandledRejection", this.listener);
  }

  stop(): void {
    process.off("unhandledRejection", this.listener);
    for (const other of this.others) process.on("unhandledRejection", other);
  }

  private report(reason: unknown): void {
    this.reasons.push(reason);
  }
}
