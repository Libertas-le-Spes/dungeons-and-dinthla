export const FOLLOW_UP_NAMES = ["clue", "answer", "progress", "completed", "failed"] as const;

export type FollowUpName = (typeof FOLLOW_UP_NAMES)[number];
