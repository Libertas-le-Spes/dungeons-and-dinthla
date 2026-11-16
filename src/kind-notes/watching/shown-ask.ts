export type DismissAsk = () => void;

export class ShownAsk {
  private readonly waiting: Set<string>;

  constructor(
    notePaths: string[],
    private readonly dismiss: DismissAsk,
  ) {
    this.waiting = new Set(notePaths);
  }

  putRight(notePath: string): void {
    if (!this.waiting.delete(notePath)) return;
    if (this.waiting.size === 0) this.dismiss();
  }
}
