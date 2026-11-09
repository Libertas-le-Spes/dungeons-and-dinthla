import { SessionNotesPage, type NotesMoves, type SessionNotesNeeds } from "../session-notes/session-notes-page";
import type { MakePage, ShowPage, StayOn } from "./campaign-pages";

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

export function notesSection(needs: NotesNeeds): MakePage {
  return (contentEl, show, path, stayOn) => new SessionNotesPage(contentEl, path, needs, movesOf(needs, show, stayOn));
}
