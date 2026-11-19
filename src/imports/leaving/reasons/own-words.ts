export class OwnWords {
  private typed = "";

  keep(value: string): void {
    this.typed = value;
  }

  get words(): string {
    return this.typed;
  }
}
