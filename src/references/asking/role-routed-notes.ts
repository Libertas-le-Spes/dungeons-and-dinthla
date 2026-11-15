import type { FencedMetadata } from "../../fence/gate/fenced-metadata";
import type { ReferenceNotesPart } from "../making/reference-notes-part";
import { isDmCampaign } from "./dm-campaign";

export interface RoleRoutedNotesNeeds {
  store: { readonly campaignFolder: string | null };
  metadata: Pick<FencedMetadata, "getCache">;
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
    const { metadata, forDm, forOthers } = this.needs;
    if (campaignFolder === null) return forOthers;
    if (isDmCampaign({ metadata, campaignFolder })) return forDm;
    return forOthers;
  }
}
