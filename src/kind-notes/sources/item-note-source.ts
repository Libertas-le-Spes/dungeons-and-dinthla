import type { Campaign, ItemEvent, ItemRecord, Source } from "../../campaign/record/campaign";
import { itemTrackedKind } from "../../kinds/item-tracked-kind";
import type { KindNoteSource } from "./kind-note-source";

function sourceOfEvent(event: ItemEvent): Source {
  return event.source;
}

function sourcesOfItem(item: ItemRecord): Source[] {
  return item.history.map(sourceOfEvent);
}

export const itemNoteSource: KindNoteSource = {
  kind: itemTrackedKind,
  sourcesOf(campaign: Campaign): Source[] {
    return campaign.items.flatMap(sourcesOfItem);
  },
};
