import type { SavedCampaign } from "../../campaign/reading/saved-campaign";
import type { Gate } from "../../fence/gate/gatekeeper";
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
import { EditorSaves, type EditorTexts } from "./editor-saves";
import type { TypingPauses } from "./typing-pauses";
import { SavesHere } from "./saves-here";

export interface KindNotesNeeds {
  gate: Gate;
  written: WrittenNotes;
  saved: SavedCampaign;
  made: NotesMade;
  items: ItemNotesPart;
  references: ReferenceNotesPart;
  say(message: string): void;
  ask: AskAboutDifference;
  editorTexts: EditorTexts;
  pauses: Pick<TypingPauses, "onPause">;
}

export function startKindNotes(needs: KindNotesNeeds): () => void {
  const { gate, saved, made, items, references, say } = needs;
  const keeper = new KindNoteKeeper({ files: gate.files, metadata: gate.metadata, actions: gate.fileActions, now: () => Date.now(), say });
  const wants = new SessionWants(saved, gate.files);
  const mover = new KindNoteMover({ files: gate.files, metadata: gate.metadata, actions: gate.fileActions, keeper, wants, say });
  const differing = new DifferingNotes(keeper, wants, needs.ask);
  const saves = new SavesHere();
  const editorSaves = new EditorSaves({ files: gate.files, store: saved, wants, saves, editorTexts: needs.editorTexts, pauses: needs.pauses });
  const watcher = new KindNoteWatcher({ store: saved, wants, written: needs.written, keeper, differing, saves, typing: editorSaves, items, references, mover });
  const backfill = new KindNoteBackfill({ store: saved, files: gate.files, keeper, items, made, say });
  const stopWatching = watcher.start();
  const stopEditorSaves = editorSaves.start(watcher);
  const opened = async (folder: string): Promise<void> => {
    await backfill.run(folder).catch((error: unknown) => say(`Couldn't make notes for the earlier sessions: ${messageOf(error)}`));
    watcher.checkAll();
  };
  const stopOpened = saved.onOpened((folder) => void opened(folder));
  return () => {
    stopWatching();
    stopEditorSaves();
    stopOpened();
  };
}
