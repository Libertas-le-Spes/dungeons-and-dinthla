const BACKSLASH = "\\";
const DOUBLE_QUOTE = '"';

export function withoutEscapes(text: string): string {
  let shown = "";
  let escaping = false;
  for (const character of text) {
    if (character === BACKSLASH && !escaping) {
      escaping = true;
      continue;
    }
    shown += character;
    escaping = false;
  }
  return shown;
}

function isDoubleQuoted(text: string): boolean {
  return text.length >= 2 && text.startsWith(DOUBLE_QUOTE) && text.endsWith(DOUBLE_QUOTE);
}

function insideQuotes(text: string): string {
  return withoutEscapes(text.substring(1, text.length - 1));
}

export function shownPropertyValue(written: string): string {
  const trimmed = written.trim();
  if (!isDoubleQuoted(trimmed)) return withoutEscapes(trimmed);
  return withoutEscapes(insideQuotes(trimmed));
}
