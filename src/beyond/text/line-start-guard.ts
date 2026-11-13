const FACT_START = /^([\p{L}\p{M}][\p{L}\p{M}\s]*):/u;
const LIST_NUMBER = /^(\d+)([.)])/;
const ASCII_PUNCTUATION = /^[!-/:-@[-`{-~]/;
const BACKSLASH = "\\";

export function withoutFactStart(line: string): string {
  return line.replace(FACT_START, "$1\\:");
}

export function withoutListNumberStart(line: string): string {
  return line.replace(LIST_NUMBER, "$1\\$2");
}

export function withoutMarkerStart(line: string): string {
  if (line.startsWith(BACKSLASH)) return line;
  if (ASCII_PUNCTUATION.test(line)) return `${BACKSLASH}${line}`;
  return line;
}
