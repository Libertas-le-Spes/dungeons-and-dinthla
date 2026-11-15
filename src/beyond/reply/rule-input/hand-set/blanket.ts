export interface Blanket {
  readonly reason: string;
  covers(name: string): boolean;
}

export class NamedBlanket implements Blanket {
  constructor(
    readonly reason: string,
    private readonly names: readonly string[],
  ) {}

  covers(name: string): boolean {
    return this.names.includes(name);
  }
}

export class EveryNumberBlanket implements Blanket {
  constructor(readonly reason: string) {}

  covers(): boolean {
    return true;
  }
}
