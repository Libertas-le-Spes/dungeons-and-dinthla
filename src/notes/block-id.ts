const BLOCK_ID = /^\^[A-Za-z0-9-]+\s*$/;

export function withoutBlockId(text: string): string {
  const caret = text.lastIndexOf("^");
  if (!BLOCK_ID.test(text.slice(caret))) return text;
  const before = text.slice(0, caret);
  if (before !== "" && before.trimEnd() === before) return text;
  return before.trimEnd();
}
