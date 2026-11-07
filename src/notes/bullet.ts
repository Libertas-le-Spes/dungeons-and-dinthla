const LIST_BULLET = /^[-*+]\s+/;

export function withoutBullet(line: string): string {
  return line.trim().replace(LIST_BULLET, "");
}
