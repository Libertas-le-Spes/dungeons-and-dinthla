export const LOOKUP_KIND_NAMES = ["question", "quest", "item"] as const;

export type LookupKindName = (typeof LOOKUP_KIND_NAMES)[number];
