import { createSession, nextSessionNumber, type NewSession, type SessionMaking } from "./create-session";
import { NO_CAMPAIGN } from "../campaign/paths/campaign-folders";
import { messageOf } from "../views/dialogs/message-of";
import type { DialogShowing } from "../views/dialogs/dialog-view";
import { NewSessionDialog } from "./new-session-dialog";
import type { NoteRef } from "../host/notes/note-ref";
import type { Telling } from "../host/showing/telling";

export type OpenSessionNotes = (path: string) => Promise<void>;

class SessionStart {
  constructor(
    private readonly telling: Pick<Telling, "say">,
    private readonly notes: SessionMaking,
    private readonly campaignFolder: string,
    private readonly openNotes: OpenSessionNotes,
  ) {}

  async makeAndOpen(session: NewSession): Promise<void> {
    let note: NoteRef;
    try {
      note = await createSession(this.notes.store, this.notes.keeping, this.campaignFolder, session);
    } catch (error) {
      this.telling.say(`Couldn't start the session: ${messageOf(error)}`);
      return;
    }
    try {
      await this.openNotes(note.path);
    } catch (error) {
      this.telling.say(`${note.basename} was made but couldn't be opened: ${messageOf(error)}`);
    }
  }
}

function pathsOf(notes: SessionMaking): string[] {
  const paths: string[] = [];
  for (const file of notes.store.files()) paths.push(file.path);
  return paths;
}

export function startSession(showing: DialogShowing, notes: SessionMaking, campaignFolder: string | null, openNotes: OpenSessionNotes): void {
  if (campaignFolder === null) {
    showing.telling.say(NO_CAMPAIGN);
    return;
  }
  const number = nextSessionNumber(pathsOf(notes), campaignFolder);
  const start = new SessionStart(showing.telling, notes, campaignFolder, openNotes);
  showing.dialogs.open(new NewSessionDialog(number, start.makeAndOpen.bind(start)));
}
