export type DraftRecord = Record<string, string>;

function isKeptText(entry: [string, unknown]): entry is [string, string] {
  const [, text] = entry;
  return typeof text === "string" && text !== "";
}

export function draftsIn(read: unknown): DraftRecord {
  if (typeof read !== "object" || read === null || Array.isArray(read)) return {};
  return Object.fromEntries(Object.entries(read).filter(isKeptText));
}
