import type { SavedCampaign } from "../../campaign/reading/saved-campaign";
import type { HostNotes } from "../../host/host";
import type { NoteSyntax } from "../../host/rules/note-syntax";
import type { WrittenNotes } from "../../fence/gate/written-notes";
import type { ReferenceNotesPart } from "../../references/making/reference-notes-part";
import { messageOf } from "../../views/dialogs/message-of";
import type { NotesMade } from "../../settings/saved/notes-made";
import { SessionWants } from "../wanting/session-wants";
import { DifferingNotes, type AskAboutDifference } from "./differing-notes";
import type { ItemNotesPart } from "./item-notes-part";
import { KindNoteBackfill } from "./kind-note-backfill";
import { KindNoteMover } from "../keeping/kind-note-mover";
import { KindNoteKeeper } from "../keeping/kind-note-keeper";
import { KindNoteWatcher } from "./kind-note-watcher";
import { SavesHere } from "./saves-here";

export interface KindNotesNeeds {
  notes: HostNotes;
  syntax: NoteSyntax;
  written: WrittenNotes;
  saved: SavedCampaign;
  made: NotesMade;
  items: ItemNotesPart;
  references: ReferenceNotesPart;
  say(message: string): void;
  ask: AskAboutDifference;
}

export function startKindNotes(needs: KindNotesNeeds): () => void {
  const { notes, syntax, saved, made, items, references, say } = needs;
  const keeper = new KindNoteKeeper({ notes, syntax, now: () => Date.now(), say });
  const wants = new SessionWants(saved, notes.store);
  const mover = new KindNoteMover({ notes, syntax, keeper, wants, say });
  const differing = new DifferingNotes(keeper, wants, needs.ask);
  const watcher = new KindNoteWatcher({ store: saved, wants, written: needs.written, keeper, differing, saves: new SavesHere(), items, references, mover });
  const backfill = new KindNoteBackfill({ store: saved, files: notes.store, keeper, items, made, say });
  const stopWatching = watcher.start();
  const opened = async (folder: string): Promise<void> => {
    await backfill.run(folder).catch((error: unknown) => say(`Couldn't make notes for the earlier sessions: ${messageOf(error)}`));
    watcher.checkAll();
  };
  const stopOpened = saved.onOpened((folder) => void opened(folder));
  return () => {
    stopWatching();
    stopOpened();
  };
}
