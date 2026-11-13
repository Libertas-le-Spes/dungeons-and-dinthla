import type { Campaign, Source } from "../../../campaign/record/campaign";
import type { TrackedKind } from "../../../kinds/tracked-kind";

export interface KindNoteSource {
  kind: TrackedKind;
  sourcesOf(campaign: Campaign): Source[];
}
