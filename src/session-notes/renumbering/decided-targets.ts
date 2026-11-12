import type { NewTarget } from "./wiki-links";

export class DecidedTargets {
  readonly newTarget: NewTarget = (target) => this.lookup(target);
  private readonly decided = new Map<string, string | null>();

  record(target: string, replacement: string | null): void {
    this.decided.set(target, replacement);
  }

  hasChange(): boolean {
    return [...this.decided.values()].some((replacement) => replacement !== null);
  }

  private lookup(target: string): string | null {
    const replacement = this.decided.get(target);
    if (replacement === undefined) return null;
    return replacement;
  }
}
