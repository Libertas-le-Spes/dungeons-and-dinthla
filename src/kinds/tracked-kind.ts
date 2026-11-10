import type { FollowUpName } from "./follow-up-name";
import type { TrackedMarker } from "./tracked-marker";
import type { TrackedPageId } from "./tracked-page-id";

export type TrackedKindName = "question" | "quest" | "coin" | "item";

export interface TrackedKind {
  name: TrackedKindName;
  marker: TrackedMarker;
  followUps: Partial<Record<FollowUpName, string>>;
  folder: string;
  page: TrackedPageId;
}
