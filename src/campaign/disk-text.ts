const BOM = "﻿";
const CRLF = "\r\n";
const LF = "\n";
const ANY_LINE_END = /\r\n?/g;

function hasBom(disk: string): boolean {
  return disk.startsWith(BOM);
}

export function withoutBom(disk: string): string {
  if (!hasBom(disk)) return disk;
  return disk.substring(BOM.length);
}

function usesCrlf(disk: string): boolean {
  return disk.includes(CRLF);
}

function withLfLines(text: string): string {
  return text.replace(ANY_LINE_END, LF);
}

export function boxTextOf(disk: string): string {
  return withLfLines(withoutBom(disk));
}

function withLineEndsOf(disk: string, text: string): string {
  const lines = withLfLines(text);
  if (!usesCrlf(disk)) return lines;
  return lines.replaceAll(LF, CRLF);
}

export function withBomOf(disk: string, text: string): string {
  if (!hasBom(disk)) return text;
  return `${BOM}${text}`;
}

export function diskTextFor(text: string, disk: string): string {
  return withBomOf(disk, withLineEndsOf(disk, text));
}
