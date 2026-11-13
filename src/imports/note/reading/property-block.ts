export class PropertyBlock {
  private constructor(
    readonly opening: string,
    readonly inside: readonly string[],
    readonly closing: string,
  ) {}

  static of(lines: readonly string[]): PropertyBlock | null {
    if (lines.length === 0) return null;
    let opening = "";
    let closing = "";
    const inside: string[] = [];
    for (const [position, line] of lines.entries()) {
      if (position === 0) opening = line;
      else if (position === lines.length - 1) closing = line;
      else inside.push(line);
    }
    return new PropertyBlock(opening, inside, closing);
  }
}
