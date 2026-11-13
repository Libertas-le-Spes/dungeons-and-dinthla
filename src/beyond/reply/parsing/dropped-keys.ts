export const DROPPED_KEYS = ["__proto__", "constructor", "prototype", "notes", "traits", "backstory", "avatarUrl"];

export function keptValue(key: string, value: unknown): unknown {
  if (DROPPED_KEYS.includes(key)) return undefined;
  return value;
}
