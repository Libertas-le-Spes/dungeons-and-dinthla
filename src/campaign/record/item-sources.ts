import type { ItemEvent, ItemRecord, Source } from "./campaign";

function sourceOfEvent(event: ItemEvent): Source {
  return event.source;
}

export function sourcesOfItem(item: ItemRecord): Source[] {
  return item.history.map(sourceOfEvent);
}
