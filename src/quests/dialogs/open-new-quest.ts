import { NO_CAMPAIGN } from "../../campaign/paths/campaign-folders";
import { charactersIn, type CharacterLinks } from "../../characters/reading/characters";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { SessionChangeWriter } from "../../campaign/changes/session-change-writer";
import { sessionLabelOf, type PropertiesSyntax } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import { latestSessionWanted } from "../../campaign/paths/session-to-write";
import { writeInSession } from "../../campaign/changes/write-in-session";
import { OpenedSession } from "../../campaign/paths/session-gone";
import { NewQuestDialog } from "./new-quest-dialog";
import type { NewQuest } from "../writing/new-quest";
import { newQuest } from "../writing/new-quest-change";
import type { NoteStore } from "../../host/notes/note-store";
import type { DialogShowing } from "../../views/dialogs/dialog-view";

export interface NewQuestNotes extends CharacterLinks {
  readonly store: Pick<NoteStore, "notes" | "files" | "note" | "read" | "change">;
}

const NO_SESSION = "Start a session first: quests are written into a session note.";

export function openNewQuest(showing: DialogShowing, notes: NewQuestNotes, store: CampaignStore, onClosed: () => void, syntax: PropertiesSyntax): void {
  const folder = store.campaignFolder;
  if (folder === null) {
    showing.telling.say(NO_CAMPAIGN);
    return;
  }
  const sessionPath = sessionForDialog(notes.store, showing.telling, folder, latestSessionWanted(NO_SESSION));
  if (sessionPath === null) return;
  const characters = charactersIn(notes, folder, sessionPath);
  const writer = new SessionChangeWriter(notes.store, syntax);
  const opened = new OpenedSession(notes.store, sessionPath);
  const add = async (entry: NewQuest) => writeInSession(opened, () => newQuest(store, entry, characters, sessionPath, syntax), writer);
  const names: string[] = [];
  for (const character of characters) names.push(character.name);
  showing.dialogs.open(new NewQuestDialog(showing.telling, sessionLabelOf(sessionPath), names, add, onClosed));
}
