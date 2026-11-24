import { firstLineAfterProperties, type PropertiesSyntax } from "../../../campaign/paths/session-file";
import { LineEnding, plainLineOf } from "../../note/reading/line-ending";
import { propertySpanOf, type PropertySpan } from "./property-span";

const LINE_BREAK = "\n";
const COMMENT = "#";

function isLoose(line: string | undefined): boolean {
  if (line === undefined) return false;
  const plain = plainLineOf(line).trim();
  return plain === "" || plain.startsWith(COMMENT);
}

export class PropertyLines {
  private constructor(
    readonly lines: readonly string[],
    readonly bodyStart: number,
    readonly ending: LineEnding,
  ) {}

  static of(text: string, syntax: PropertiesSyntax): PropertyLines {
    return new PropertyLines(text.split(LINE_BREAK), firstLineAfterProperties(text, syntax), LineEnding.of(text));
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

  spanIs(span: PropertySpan, wanted: string | null): boolean {
    if (wanted === null) return false;
    const found = this.linesIn(span.start, span.end).map(plainLineOf);
    return found.length === 1 && found.includes(wanted);
  }

  hasLooseLineNextTo(span: PropertySpan): boolean {
    return isLoose(this.lines.at(span.start - 1)) || isLoose(this.lines.at(span.end));
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
