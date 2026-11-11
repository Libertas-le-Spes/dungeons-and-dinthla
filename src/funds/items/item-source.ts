import type { Campaign, SessionNote } from "../../campaign/campaign";

export interface ItemSource {
  readonly current: Campaign;
  readonly sessionNotes: SessionNote[];
}
