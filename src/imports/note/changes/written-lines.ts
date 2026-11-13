import { plainLineOf } from "../reading/line-ending";

export function writtenLinesOf(lines: readonly string[]): string[] {
  const written: string[] = [];
  for (const line of lines) {
    const plain = plainLineOf(line);
    if (plain.trim() !== "") written.push(plain);
  }
  return written;
}
