const CRLF = "\r\n";
const RETURN = "\r";
const NO_RETURN = "";

export class LineEnding {
  private constructor(private readonly tail: string) {}

  static of(text: string): LineEnding {
    if (text.includes(CRLF)) return new LineEnding(RETURN);
    return new LineEnding(NO_RETURN);
  }

  ends(line: string): string {
    return `${line}${this.tail}`;
  }
}

export function plainLineOf(line: string): string {
  if (line.endsWith(RETURN)) return line.slice(0, line.length - RETURN.length);
  return line;
}
