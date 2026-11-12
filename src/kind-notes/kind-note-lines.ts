import type { Campaign, SessionNote, Source } from "../campaign/record/campaign";
import { lineTextsOf } from "./line-texts";
import { KIND_NOTE_SOURCES } from "./sources/kind-note-sources";

function sourcesInFolder(campaign: Campaign, folder: string): Source[] {
  const sources: Source[] = [];
  for (const noteSource of KIND_NOTE_SOURCES) {
    if (noteSource.kind.kindNoteFolder === folder) sources.push(...noteSource.sourcesOf(campaign));
  }
  return sources;
}

export function kindNoteLines(campaign: Campaign, session: SessionNote, folder: string): string[] {
  return lineTextsOf(session, sourcesInFolder(campaign, folder));
}
