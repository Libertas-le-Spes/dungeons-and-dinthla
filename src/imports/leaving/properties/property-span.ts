import { plainLineOf } from "../../note/reading/line-ending";
import { continuesAKey, propertyKeyOf } from "../../note/reading/property-key";
import { propertyByCapitals, propertyTwice } from "./property-refusals";

export interface PropertySpan {
  readonly start: number;
  readonly end: number;
}

class SpanFinder {
  private start: number | null = null;
  private end = 0;
  private owned = false;

  constructor(private readonly key: string) {}

  read(line: string, position: number): void {
    const plain = plainLineOf(line);
    const found = propertyKeyOf(plain);
    if (found !== null) this.owned = this.isWanted(found, position);
    else if (!continuesAKey(plain)) this.owned = false;
    if (this.owned) this.end = position + 1;
  }

  span(): PropertySpan | null {
    if (this.start === null) return null;
    return { start: this.start, end: this.end };
  }

  private isWanted(found: string, position: number): boolean {
    if (found === this.key) {
      if (this.start !== null) throw propertyTwice(this.key);
      this.start = position;
      return true;
    }
    if (found.toLowerCase() === this.key.toLowerCase()) throw propertyByCapitals(found, this.key);
    return false;
  }
}

export function propertySpanOf(lines: readonly string[], closing: number, key: string): PropertySpan | null {
  const finder = new SpanFinder(key);
  for (const [position, line] of lines.entries()) {
    if (position > 0 && position < closing) finder.read(line, position);
  }
  return finder.span();
}
