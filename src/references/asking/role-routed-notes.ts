import type { ReferenceNotesPart } from "../making/reference-notes-part";
import { isDmCampaign, type DmCampaignNotes } from "./dm-campaign";

export interface RoleRoutedNotesNeeds {
  store: { readonly campaignFolder: string | null };
  notes: DmCampaignNotes;
  forDm: ReferenceNotesPart;
  forOthers: ReferenceNotesPart;
}

export class RoleRoutedNotes implements ReferenceNotesPart {
  constructor(private readonly needs: RoleRoutedNotesNeeds) {}

  sessionSaved(path: string): void {
    this.partFor(this.needs.store.campaignFolder).sessionSaved(path);
  }

  sessionGone(path: string): void {
    this.needs.forDm.sessionGone(path);
    this.needs.forOthers.sessionGone(path);
  }

  private partFor(campaignFolder: string | null): ReferenceNotesPart {
    const { notes, forDm, forOthers } = this.needs;
    if (campaignFolder === null) return forOthers;
    if (isDmCampaign({ notes, campaignFolder })) return forDm;
    return forOthers;
  }
}
