import { PENDING_FOCUS_MS } from "./row-focus";

export class FocusAfter {
  private until = 0;

  arm(): void {
    this.until = Date.now() + PENDING_FOCUS_MS;
  }

  isArmed(): boolean {
    return Date.now() < this.until;
  }
}
