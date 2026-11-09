export type DraftRecord = Record<string, string>;

export function draftsIn(read: unknown): DraftRecord {
  const drafts: DraftRecord = {};
  if (typeof read !== "object" || read === null || Array.isArray(read)) return drafts;
  for (const [key, text] of Object.entries(read)) {
    if (typeof text === "string" && text !== "") drafts[key] = text;
  }
  return drafts;
}
