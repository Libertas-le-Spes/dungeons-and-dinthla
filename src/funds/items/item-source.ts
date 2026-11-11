import type { Campaign, SessionNote } from "../../campaign/record/campaign";

export interface ItemSource {
  readonly current: Campaign;
  readonly sessionNotes: SessionNote[];
}
