const SPECIAL = /[.*+?^${}()|[\]\\]/g;
const ENDS_IN_WORD = /\w$/;
const BREAK_AFTER = "(?=\\s|$)";

function escaped(symbol: string): string {
  return symbol.replace(SPECIAL, "\\$&");
}

function patternOf(symbol: string): string {
  if (ENDS_IN_WORD.test(symbol)) return escaped(symbol) + BREAK_AFTER;
  return escaped(symbol);
}

function longestFirst(first: string, second: string): number {
  return second.length - first.length;
}

export function symbolPatternOf(symbols: readonly string[]): string {
  const ordered = Array.from(symbols).sort(longestFirst);
  return ordered.map(patternOf).join("|");
}
