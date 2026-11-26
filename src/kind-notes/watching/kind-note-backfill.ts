import { bySessionNumber } from "../../campaign/record/session-lines";
import type { Campaign, SessionNote } from "../../campaign/record/campaign";
import type { NoteStore } from "../../host/notes/note-store";
import type { NotesMade } from "../../settings/saved/notes-made";
import type { MakeTally } from "../../note-keeping/make-result";
import type { ItemNotesPart } from "./item-notes-part";
import type { KindNoteKeeper } from "../keeping/kind-note-keeper";
import { wantedNotesFor } from "../wanting/wanted-notes";

export interface BackfilledCampaign {
  readonly current: Campaign;
  readonly sessionNotes: SessionNote[];
  readonly campaignFolder: string | null;
  readonly opening: boolean;
}

export interface KindNoteBackfillNeeds {
  store: BackfilledCampaign;
  files: Pick<NoteStore, "note">;
  keeper: Pick<KindNoteKeeper, "makeIfMissing">;
  items: Pick<ItemNotesPart, "makeMissing">;
  made: Pick<NotesMade, "hasMadeFor" | "markMadeFor">;
  say(message: string): void;
}

function countOf(count: number, thing: string): string {
  if (count === 1) return `1 ${thing}`;
  return `${count} ${thing}s`;
}

export function madeNotesMessage(sessions: number, items: number): string {
  const counts: string[] = [];
  if (sessions > 0) counts.push(countOf(sessions, "session"));
  if (items > 0) counts.push(countOf(items, "item"));
  return `Made notes for ${counts.join(" and ")}.`;
}

export class KindNoteBackfill {
  constructor(private readonly needs: KindNoteBackfillNeeds) {}

  async run(campaignFolder: string): Promise<void> {
    if (this.needs.made.hasMadeFor(campaignFolder)) return;
    const campaign = this.needs.store.current;
    const sessions = [...this.needs.store.sessionNotes].sort(bySessionNumber);
    if (sessions.length === 0) return;
    let failedNotes = 0;
    let sessionsMade = 0;
    for (const session of sessions) {
      if (!this.isOpen(campaignFolder)) break;
      const sessionTally = await this.makeFor(campaignFolder, campaign, session);
      if (sessionTally.made > 0) sessionsMade += 1;
      failedNotes += sessionTally.failed;
    }
    if (!this.isOpen(campaignFolder)) {
      this.tell(sessionsMade, 0);
      return;
    }
    const items = await this.needs.items.makeMissing();
    this.tell(sessionsMade, items.made);
    if (failedNotes + items.failed > 0 || !this.isOpen(campaignFolder)) return;
    await this.needs.made.markMadeFor(campaignFolder);
  }

  private isOpen(campaignFolder: string): boolean {
    const { store } = this.needs;
    return store.campaignFolder === campaignFolder && !store.opening;
  }

  private tell(sessionsMade: number, itemsMade: number): void {
    if (sessionsMade > 0 || itemsMade > 0) this.needs.say(madeNotesMessage(sessionsMade, itemsMade));
  }

  private async makeFor(campaignFolder: string, campaign: Campaign, session: SessionNote): Promise<MakeTally> {
    const file = this.needs.files.note(session.path);
    const wanted = wantedNotesFor(campaignFolder, campaign, { path: session.path, file, note: session });
    const tally: MakeTally = { made: 0, failed: 0 };
    for (const note of wanted) {
      const result = await this.needs.keeper.makeIfMissing(note);
      if (result === "made") tally.made += 1;
      if (result === "failed") tally.failed += 1;
    }
    return tally;
  }
}
