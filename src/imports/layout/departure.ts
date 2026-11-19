export const DEPARTURE_PROPERTY = "departure";

const QUOTE = '"';

export function departureLine(words: string): string {
  return `${DEPARTURE_PROPERTY}: ${JSON.stringify(words)}`;
}

function unquoted(value: string): string | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function departureOf(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith(QUOTE)) return wordsOrNull(trimmed);
  const words = unquoted(trimmed);
  if (words === null) return null;
  return wordsOrNull(words.trim());
}

function wordsOrNull(words: string): string | null {
  if (words === "") return null;
  return words;
}
