import type { Campaign, SessionNote } from "../campaign/record/campaign";
import type { FencedFiles } from "../fence/gate/fenced-files";
import type { NotesMade } from "../settings/saved/notes-made";
import type { ItemNotesPart } from "./item-notes-part";
import type { KindNoteKeeper } from "./kind-note-keeper";
import { wantedNotesFor } from "./wanted-notes";

export interface BackfilledCampaign {
  readonly current: Campaign;
  readonly sessionNotes: SessionNote[];
}

export interface KindNoteBackfillNeeds {
  store: BackfilledCampaign;
  files: Pick<FencedFiles, "getFileByPath">;
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

function byNumber(first: SessionNote, second: SessionNote): number {
  return first.number - second.number;
}

export class KindNoteBackfill {
  constructor(private readonly needs: KindNoteBackfillNeeds) {}

  async run(campaignFolder: string): Promise<void> {
    if (this.needs.made.hasMadeFor(campaignFolder)) return;
    let sessionsMade = 0;
    for (const session of [...this.needs.store.sessionNotes].sort(byNumber)) {
      if (await this.makeFor(campaignFolder, session)) sessionsMade += 1;
    }
    const itemsMade = await this.needs.items.makeMissing();
    if (sessionsMade > 0 || itemsMade > 0) this.needs.say(madeNotesMessage(sessionsMade, itemsMade));
    await this.needs.made.markMadeFor(campaignFolder);
  }

  private async makeFor(campaignFolder: string, session: SessionNote): Promise<boolean> {
    const file = this.needs.files.getFileByPath(session.path);
    const wanted = wantedNotesFor(campaignFolder, this.needs.store.current, { path: session.path, file, note: session });
    let made = false;
    for (const note of wanted) {
      if (await this.needs.keeper.makeIfMissing(note)) made = true;
    }
    return made;
  }
}
