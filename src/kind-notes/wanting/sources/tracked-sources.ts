import type { Campaign, Source } from "../../../campaign/record/campaign";
import { KIND_NOTE_SOURCES } from "./kind-note-sources";

export function trackedSourcesOf(campaign: Campaign): Source[] {
  return KIND_NOTE_SOURCES.flatMap((noteSource) => noteSource.sourcesOf(campaign));
}
