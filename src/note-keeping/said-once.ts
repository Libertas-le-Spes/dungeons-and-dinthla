export class SaidOnce {
  private readonly said = new Set<string>();

  constructor(private readonly tell: (message: string) => void) {}

  say(key: string, message: string): void {
    if (this.said.has(key)) return;
    this.said.add(key);
    this.tell(message);
  }
}
