import type { ItemRecord, SessionNote } from "../../campaign/record/campaign";
import { sourcesOfItem } from "../../campaign/record/item-sources";
import { lineTextsOf } from "../../campaign/record/line-texts";
import { bySessionNumber } from "../../campaign/record/session-lines";

export function itemNoteLines(item: ItemRecord, sessions: SessionNote[]): string[] {
  const sources = sourcesOfItem(item);
  const lines: string[] = [];
  for (const session of [...sessions].sort(bySessionNumber)) lines.push(...lineTextsOf(session, sources));
  return lines;
}
