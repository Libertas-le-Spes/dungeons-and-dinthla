const ESCAPED_TEXTS = ["\\", "[", "]", "`", "<", ">", "|", "#", "*", "_", "$", "^", "%%", "==", "~~", "::"];

function withBackslash(character: string): string {
  return `\\${character}`;
}

function withBackslashBeforeEach(text: string): string {
  return Array.from(text).map(withBackslash).join("");
}

function withEscaped(text: string, escapedText: string): string {
  return text.split(escapedText).join(withBackslashBeforeEach(escapedText));
}

export function withEscapedCharacters(text: string): string {
  let escaped = text;
  for (const escapedText of ESCAPED_TEXTS) escaped = withEscaped(escaped, escapedText);
  return escaped;
}
