import { Notice, type App, type TFile } from "obsidian";
import { createSession, nextSessionNumber, type NewSession } from "./create-session";
import { NewSessionModal } from "./new-session-modal";

const NO_CAMPAIGN = "Make a campaign first: a top-level folder with a main note of the same name.";

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function makeAndOpen(app: App, campaignFolder: string, session: NewSession): Promise<void> {
  let note: TFile;
  try {
    note = await createSession(app.vault, app.fileManager, campaignFolder, session);
  } catch (error) {
    new Notice(`Couldn't start the session: ${messageOf(error)}`);
    return;
  }
  try {
    await app.workspace.getLeaf(false).openFile(note);
  } catch (error) {
    new Notice(`${note.basename} was made but couldn't be opened: ${messageOf(error)}`);
  }
}

export function startSession(app: App, campaignFolder: string | null): void {
  if (campaignFolder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const number = nextSessionNumber(app.vault.getFiles().map((file) => file.path), campaignFolder);
  new NewSessionModal(app, number, (session) => void makeAndOpen(app, campaignFolder, session)).open();
}
