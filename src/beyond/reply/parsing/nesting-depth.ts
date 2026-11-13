const QUOTE = '"';
const BACKSLASH = "\\";
const OPENERS = new Set(["[", "{"]);
const CLOSERS = new Set(["]", "}"]);

class NestingScan {
  private inString = false;
  private escaped = false;
  private depth = 0;
  private deepest = 0;

  read(character: string): void {
    if (this.inString) this.readInString(character);
    else this.readOutsideString(character);
  }

  get deepestNesting(): number {
    return this.deepest;
  }

  private readInString(character: string): void {
    if (this.escaped) {
      this.escaped = false;
      return;
    }
    if (character === BACKSLASH) this.escaped = true;
    if (character === QUOTE) this.inString = false;
  }

  private readOutsideString(character: string): void {
    if (character === QUOTE) this.inString = true;
    if (OPENERS.has(character)) this.open();
    if (CLOSERS.has(character)) this.depth -= 1;
  }

  private open(): void {
    this.depth += 1;
    if (this.depth > this.deepest) this.deepest = this.depth;
  }
}

export function deepestNestingOf(characters: Iterable<string>): number {
  const scan = new NestingScan();
  for (const character of characters) scan.read(character);
  return scan.deepestNesting;
}
