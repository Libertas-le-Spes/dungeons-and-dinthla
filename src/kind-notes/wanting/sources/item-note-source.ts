import type { Campaign, Source } from "../../../campaign/record/campaign";
import { sourcesOfItem } from "../../../campaign/record/item-sources";
import { itemTrackedKind } from "../../../kinds/item-tracked-kind";
import type { KindNoteSource } from "./kind-note-source";

export const itemNoteSource: KindNoteSource = {
  kind: itemTrackedKind,
  sourcesOf(campaign: Campaign): Source[] {
    return campaign.items.flatMap(sourcesOfItem);
  },
};
