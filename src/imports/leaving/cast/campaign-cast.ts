import type { Campaign } from "../../../campaign/record/campaign";
import type { NoteRef } from "../../../host/notes/note-ref";

export interface CampaignCast {
  mainFrom(campaignNote: NoteRef, asked: string): NoteRef | null;
  campaignOf(campaignFolder: string): Promise<Campaign>;
  latestSessionLink(campaignFolder: string, fromPath: string): string | null;
  linkTo(file: NoteRef, fromPath: string): string;
}
