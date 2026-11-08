export const CONFIRM_MS = 4000;

export class SecondPress {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly showArmed: (armed: boolean) => void,
    private readonly confirmed: () => void,
  ) {}

  press(): void {
    if (this.timer !== null) {
      this.stop();
      this.confirmed();
      return;
    }
    this.showArmed(true);
    this.timer = setTimeout(() => this.stop(), CONFIRM_MS);
  }

  stop(): void {
    if (this.timer === null) return;
    clearTimeout(this.timer);
    this.timer = null;
    this.showArmed(false);
  }
}
