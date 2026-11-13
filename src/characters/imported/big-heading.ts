const BIG_HEADING = /^ {0,3}#{1,2}(?:[ \t]|$)/;

export function isBigHeading(line: string): boolean {
  return BIG_HEADING.test(line);
}
