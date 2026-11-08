const LIST_BULLET = /^[-*+]\s+/;

export function withoutBullet(line: string): string {
  return line.trim().replace(LIST_BULLET, "");
}

const LEADING_BULLET = /^\s*(?:[-*+]\s+)?/;

export function bulletLengthOf(line: string): number {
  return LEADING_BULLET.exec(line)![0].length;
}
