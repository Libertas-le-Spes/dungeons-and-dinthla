export class DialogShown {
  private shown = true;

  get isShown(): boolean {
    return this.shown;
  }

  stop(): void {
    this.shown = false;
  }
}
