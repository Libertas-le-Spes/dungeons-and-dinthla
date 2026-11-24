import { SessionNotesPage, type NotesMoves, type SessionNotesNeeds } from "../../session-notes/page/session-notes-page";
import type { MakePage, ShowPage, StayOn } from "../view/campaign-pages";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

export interface NotesNeeds extends SessionNotesNeeds {
  startSession(): void;
}

function movesOf(needs: NotesNeeds, show: ShowPage, stayOn: StayOn): NotesMoves {
  return {
    showSession: (path) => show({ page: "notes", path }),
    showNoSession: () => show({ page: "notes", path: null }),
    startSession: () => needs.startSession(),
    stayOn,
  };
}

export function notesSection(needs: NotesNeeds, syntax: PropertiesSyntax): MakePage {
  return (contentEl, show, path, stayOn) => new SessionNotesPage(contentEl, path, needs, movesOf(needs, show, stayOn), syntax);
}
