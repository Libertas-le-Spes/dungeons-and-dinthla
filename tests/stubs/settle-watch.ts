export class SettleWatch {
  settled = false;
  readonly done: Promise<void>;

  constructor(settling: Promise<unknown>) {
    this.done = settling.then(this.markSettled.bind(this));
  }

  private markSettled(): void {
    this.settled = true;
  }
}
