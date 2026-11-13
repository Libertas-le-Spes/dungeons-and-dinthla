const KEY_LINE = /^([^\s#:'"-][^:]*?)\s*:(?:\s|$)/;
const CONTINUATION = /^(?:[ \t]|-(?:\s|$))/;

export function propertyKeyOf(line: string): string | null {
  const match = KEY_LINE.exec(line);
  if (match === null) return null;
  const key = match[1];
  if (key === undefined) return null;
  return key;
}

export function continuesAKey(line: string): boolean {
  return CONTINUATION.test(line);
}
