import { Notice, type App, type TFile } from "obsidian";
import { createSession, nextSessionNumber, type NewSession } from "./create-session";
import { NO_CAMPAIGN } from "../campaign/campaign-folders";
import { messageOf } from "../views/message-of";
import { NewSessionModal } from "./new-session-modal";

export type OpenSessionNotes = (path: string) => Promise<void>;

async function makeAndOpen(app: App, campaignFolder: string, session: NewSession, openNotes: OpenSessionNotes): Promise<void> {
  let note: TFile;
  try {
    note = await createSession(app.vault, app.fileManager, campaignFolder, session);
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

export function startSession(app: App, campaignFolder: string | null, openNotes: OpenSessionNotes): void {
  if (campaignFolder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const number = nextSessionNumber(app.vault.getFiles().map((file) => file.path), campaignFolder);
  new NewSessionModal(app, number, (session) => void makeAndOpen(app, campaignFolder, session, openNotes)).open();
}
