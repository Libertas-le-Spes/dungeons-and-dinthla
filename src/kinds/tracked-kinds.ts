import { coinTrackedKind } from "./coin-tracked-kind";
import { itemTrackedKind } from "./item-tracked-kind";
import { questTrackedKind } from "./quest-tracked-kind";
import { questionTrackedKind } from "./question-tracked-kind";
import type { TrackedKind, TrackedKindName } from "./tracked-kind";

export const TRACKED_KINDS = {
  question: questionTrackedKind,
  quest: questTrackedKind,
  coin: coinTrackedKind,
  item: itemTrackedKind,
} satisfies Record<TrackedKindName, TrackedKind>;
