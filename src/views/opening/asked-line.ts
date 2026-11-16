export function askedLineOf(state: unknown): number | null {
  if (typeof state !== "object" || state === null) return null;
  if (!("line" in state)) return null;
  const line = state.line;
  if (typeof line !== "number") return null;
  if (!Number.isInteger(line) || line < 0) return null;
  return line;
}
