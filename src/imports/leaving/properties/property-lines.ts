import { firstLineAfterProperties } from "../../../campaign/paths/session-file";
import { LineEnding } from "../../note/reading/line-ending";
import { propertySpanOf, type PropertySpan } from "./property-span";

const LINE_BREAK = "\n";

export class PropertyLines {
  private constructor(
    readonly lines: readonly string[],
    readonly bodyStart: number,
    readonly ending: LineEnding,
  ) {}

  static of(text: string): PropertyLines {
    return new PropertyLines(text.split(LINE_BREAK), firstLineAfterProperties(text), LineEnding.of(text));
  }

  hasBlock(): boolean {
    return this.bodyStart > 0;
  }

  closing(): number {
    return this.bodyStart - 1;
  }

  spanOf(key: string): PropertySpan | null {
    if (!this.hasBlock()) return null;
    return propertySpanOf(this.lines, this.closing(), key);
  }

  linesIn(from: number, to: number): string[] {
    const found: string[] = [];
    for (const [position, line] of this.lines.entries()) {
      if (position >= from && position < to) found.push(line);
    }
    return found;
  }
}

export function joinedLines(lines: readonly string[]): string {
  return lines.join(LINE_BREAK);
}
