const INDENT_AND_BULLET = /^\s*(?:[-*+]\s+)?/;

export function markerStartOf(line: string): number {
  return INDENT_AND_BULLET.exec(line)![0].length;
}

export function withoutBullet(line: string): string {
  return line.slice(markerStartOf(line)).trim();
}
