export const MARKER_NAMES = ["question", "quest", "ledger"] as const;

export type MarkerName = (typeof MARKER_NAMES)[number];
