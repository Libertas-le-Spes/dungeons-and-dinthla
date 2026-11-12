import type { ItemEvent, ItemRecord, SessionNote } from "../../campaign/record/campaign";
import { lineTextsOf } from "../../kind-notes/line-texts";

function bySessionNumber(first: SessionNote, second: SessionNote): number {
  return first.number - second.number;
}

function sourceOfEvent(event: ItemEvent) {
  return event.source;
}

export function itemNoteLines(item: ItemRecord, sessions: SessionNote[]): string[] {
  const sources = item.history.map(sourceOfEvent);
  const lines: string[] = [];
  for (const session of [...sessions].sort(bySessionNumber)) lines.push(...lineTextsOf(session, sources));
  return lines;
}
