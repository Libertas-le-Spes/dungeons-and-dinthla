import { mainNotePathOf } from "../../campaign/paths/campaign-folders";
import type { NoteFacts } from "../../host/notes/note-facts";
import type { NoteStore } from "../../host/notes/note-store";

export const DM_ROLE = "dm";

export interface DmCampaignNotes {
  readonly store: Pick<NoteStore, "note">;
  readonly facts: Pick<NoteFacts, "propertiesOf">;
}

export function isDmCampaign({ notes, campaignFolder }: { notes: DmCampaignNotes; campaignFolder: string }): boolean {
  const main = notes.store.note(mainNotePathOf(campaignFolder));
  if (main === null) return false;
  const properties = notes.facts.propertiesOf(main);
  if (properties === null) return false;
  return properties.role === DM_ROLE;
}
