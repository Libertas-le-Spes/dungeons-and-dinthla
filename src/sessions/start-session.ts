import { Notice, type App, type TFile } from "obsidian";
import { createSession, nextSessionNumber, type NewSession } from "./create-session";
import { NO_CAMPAIGN } from "../campaign/paths/campaign-folders";
import { messageOf } from "../views/dialogs/message-of";
import { NewSessionModal } from "./new-session-modal";
import type { Gate } from "../fence/gate/gatekeeper";

export type OpenSessionNotes = (path: string) => Promise<void>;

async function makeAndOpen(app: App, gate: Gate, campaignFolder: string, session: NewSession, openNotes: OpenSessionNotes): Promise<void> {
  let note: TFile;
  try {
    note = await createSession(gate.files, gate.fileActions, campaignFolder, session);
  } catch (error) {
    new Notice(`Couldn't start the session: ${messageOf(error)}`);
    return;
  }
  try {
    await openNotes(note.path);
  } catch (error) {
    new Notice(`${note.basename} was made but couldn't be opened: ${messageOf(error)}`);
  }
}

export function startSession(app: App, gate: Gate, campaignFolder: string | null, openNotes: OpenSessionNotes): void {
  if (campaignFolder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const number = nextSessionNumber(gate.files.getFiles().map((file) => file.path), campaignFolder);
  new NewSessionModal(app, number, (session) => void makeAndOpen(app, gate, campaignFolder, session, openNotes)).open();
}
