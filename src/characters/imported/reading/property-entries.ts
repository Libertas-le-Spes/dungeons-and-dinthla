export interface PropertyEntry {
  readonly key: string;
  readonly value: string;
  readonly line: number;
}

const QUOTES = ['"', "'"];
const COLON = ":";
const PROPERTY_FENCE = "---";

function unquotedKey(key: string): string {
  if (key.length < 2) return key;
  const quote = key.charAt(0);
  if (!QUOTES.includes(quote)) return key;
  if (key.charAt(key.length - 1) !== quote) return key;
  return key.substring(1, key.length - 1);
}

function entryOf(line: string, index: number): PropertyEntry | null {
  const colon = line.indexOf(COLON);
  if (colon < 1) return null;
  if (line.charAt(colon + 1).trim() !== "") return null;
  return { key: unquotedKey(line.substring(0, colon).trimEnd()), value: line.substring(colon + 1), line: index };
}

export function propertyEntriesOf(lines: readonly string[], bodyStart: number): PropertyEntry[] {
  const entries: PropertyEntry[] = [];
  for (const [index, line] of lines.entries()) {
    if (index >= bodyStart || line === PROPERTY_FENCE) continue;
    const entry = entryOf(line, index);
    if (entry !== null) entries.push(entry);
  }
  return entries;
}
